# Forensic Reality: Messy Data Solutions

This document details the technical engines designed to handle "In-the-Wild" data friction during financial audits.

## 1. The Redaction Reconstructor (Triangulation)
**Problem**: Redacted transaction lines in bank statements.
**Solution**: Multi-Source Inference.
*   **Logic**: Cross-references the redacted line's *Amount* and *Date* against unredacted vendor invoices, internal ledger entries, and global recurring payment signatures to "unmask" the entity.

## 2. The LIBR Algorithm (Co-mingling)
**Problem**: Personal accounts used for business, mixed with non-business expenses.
**Solution**: **Lowest Intermediate Balance Rule (LIBR)**.
*   **Algorithm**: The engine tracks the personal wealth buffer in a mixed account. It assumes personal funds are spent *first*. Any business expense that exceeds the personal buffer is automatically flagged as an illicit capital infusion or business asset misuse.

## 3. Temporal Pair Matching (Mirror Detection)
**Problem**: Excessive intra-account transfers (Self-Transfers) creating artificial revenue/expense volume.
**Solution**: **Net-Zero Filtering**.
*   **Logic**: Flags $X outflow from Account A and $X inflow to Account B within 48 hours.
*   **Action**: Automatically "Collapses" these pairs in the UI and excludes them from the net risk/volume calculations to ensure a cleaner audit trail.

## 4. Timeline Interpolation (Data Gaps)
**Problem**: Missing months of data for a specific account.
**Solution**: **Forensic Imputation**.
*   **Strategy**: Uses "Balance Anchoring" (Ending balance of Month N vs Starting balance of Month N+2) to infer the delta for the missing Month N+1.
*   **Inference**: Fills the gap with known recurring payments (Rent, Salary) to maintain the continuity of the **Theory of Intent**.
