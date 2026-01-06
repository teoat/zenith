from datetime import timedelta

import numpy as np
import pandas as pd
from thefuzz import fuzz


def normalize_columns(df):
    """Normalize column names to lowercase for easier matching."""
    df.columns = [c.strip().lower() for c in df.columns]
    return df


def get_fuzzy_score(str1, str2):
    """Calculate fuzzy match score between two strings."""
    if not isinstance(str1, str) or not isinstance(str2, str):
        return 0
    return fuzz.token_sort_ratio(str1, str2)


def find_amount_column(df):
    for col in df.columns:
        if any(
            keyword in col
            for keyword in ["amount", "price", "value", "credit", "debit", "balance"]
        ):
            return col
    return None


def find_date_column(df):
    for col in df.columns:
        if "date" in col or "time" in col:
            return col
    return None


def find_description_column(df):
    for col in df.columns:
        if any(k in col for k in ["desc", "detail", "narration", "memo"]):
            return col
    return None


def reconcile_dataframes(df_a, df_b, date_tolerance_days=3):
    """
    Perform advanced reconciliation with Multi-Stage Matching:
    1. Exact Match (Amount + Date)
    2. Fuzzy Match (Amount + Description Similarity)
    3. Date Tolerance Match (Amount + Date within window)
    """
    # 1. Pre-processing
    df_a = normalize_columns(df_a.copy())
    df_b = normalize_columns(df_b.copy())

    col_amt_a, col_amt_b = find_amount_column(df_a), find_amount_column(df_b)
    col_date_a, col_date_b = find_date_column(df_a), find_date_column(df_b)
    col_desc_a, col_desc_b = (
        find_description_column(df_a),
        find_description_column(df_b),
    )

    if not col_amt_a or not col_amt_b:
        return {"error": "Amount columns not found"}

    # Ensure dates are datetime
    if col_date_a:
        df_a[col_date_a] = pd.to_datetime(df_a[col_date_a], errors="coerce")
    if col_date_b:
        df_b[col_date_b] = pd.to_datetime(df_b[col_date_b], errors="coerce")

    # Add ID tracking to avoid double matching
    df_a["_recon_id"] = range(len(df_a))
    df_b["_recon_id"] = range(len(df_b))
    df_a["_matched"] = False
    df_b["_matched"] = False

    matches = []

    # 2. Exact Match Strategy
    # Iterate A and look for exact match in B (Amount + Date)
    for idx_a, row_a in df_a.iterrows():
        if row_a["_matched"]:
            continue

        # Filter B for candidates (Amount match)
        candidates = df_b[
            (df_b["_matched"] == False)
            & (np.isclose(df_b[col_amt_b], row_a[col_amt_a], atol=0.01))
        ]

        # Refine by Date if available
        if col_date_a and col_date_b and not pd.isna(row_a[col_date_a]):
            # Exact Date
            exact_date_match = candidates[candidates[col_date_b] == row_a[col_date_a]]
            if not exact_date_match.empty:
                # Match found!
                match_row_b = exact_date_match.iloc[0]
                df_a.at[idx_a, "_matched"] = True
                df_b.at[match_row_b.name, "_matched"] = True
                matches.append(
                    {
                        "record_a": row_a.to_dict(),
                        "record_b": match_row_b.to_dict(),
                        "type": "exact",
                        "score": 100,
                    }
                )
                continue

            # Date Tolerance
            # e.g. B date is within A date +/- tolerance
            date_window_match = candidates[
                (
                    candidates[col_date_b]
                    >= row_a[col_date_a] - timedelta(days=date_tolerance_days)
                )
                & (
                    candidates[col_date_b]
                    <= row_a[col_date_a] + timedelta(days=date_tolerance_days)
                )
            ]
            if not date_window_match.empty:
                match_row_b = date_window_match.iloc[0]
                df_a.at[idx_a, "_matched"] = True
                df_b.at[match_row_b.name, "_matched"] = True
                matches.append(
                    {
                        "record_a": row_a.to_dict(),
                        "record_b": match_row_b.to_dict(),
                        "type": "date_tolerance",
                        "score": 95,
                    }
                )
                continue

    # 3. Fuzzy Description Match (for remaining unmatched with same amount)
    # Using thefuzz
    if col_desc_a and col_desc_b:
        for idx_a, row_a in df_a.iterrows():
            if row_a["_matched"]:
                continue

            # Find candidates with same amount but no date match
            candidates = df_b[
                (df_b["_matched"] == False)
                & (np.isclose(df_b[col_amt_b], row_a[col_amt_a], atol=0.01))
            ]

            if not candidates.empty:
                # Calculate scores
                best_score = 0
                best_candidate = None

                for idx_b, row_b in candidates.iterrows():
                    score = get_fuzzy_score(
                        str(row_a[col_desc_a]), str(row_b[col_desc_b])
                    )
                    if score > best_score:
                        best_score = score
                        best_candidate = row_b

                if best_score > 70:  # Fuzzy threshold
                    df_a.at[idx_a, "_matched"] = True
                    df_b.at[best_candidate.name, "_matched"] = True
                    matches.append(
                        {
                            "record_a": row_a.to_dict(),
                            "record_b": best_candidate.to_dict(),
                            "type": "fuzzy",
                            "score": best_score,
                        }
                    )

    # 4. Result Compilation
    unmatched_a = (
        df_a[df_a["_matched"] == False]
        .drop(columns=["_recon_id", "_matched"])
        .fillna("")
        .to_dict("records")
    )
    unmatched_b = (
        df_b[df_b["_matched"] == False]
        .drop(columns=["_recon_id", "_matched"])
        .fillna("")
        .to_dict("records")
    )

    # Convert timestamp objects to strings for JSON serialization in results
    def serialize_dict(d):
        return {
            k: (v.isoformat() if isinstance(v, pd.Timestamp) else v)
            for k, v in d.items()
        }

    return {
        "summary": {
            "total_records_a": len(df_a),
            "matched_count": len(matches),
            "unmatched_a_count": len(unmatched_a),
            "unmatched_b_count": len(unmatched_b),
        },
        "matches": [
            {
                "type": m["type"],
                "score": m["score"],
                "record_a": serialize_dict(m["record_a"]),
                "record_b": serialize_dict(m["record_b"]),
            }
            for m in matches
        ],
        "unmatched_a": [serialize_dict(r) for r in unmatched_a],
        "unmatched_b": [serialize_dict(r) for r in unmatched_b],
    }
