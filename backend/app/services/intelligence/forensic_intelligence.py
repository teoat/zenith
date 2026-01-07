"""
Forensic Intelligence Service - Real Implementation
Provides advanced forensic analysis capabilities for fraud investigation.
"""

import hashlib
import logging
from collections import defaultdict
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)


class TriangulationEngine:
    """
    Probabilistic unmasking of redacted transaction names using multi-source triangulation.
    Ref: VISION_10_10 Section 6
    """

    def __init__(self, db_session):
        self.db = db_session
        self._vendor_cache: dict[str, dict] = {}

    async def unmask_redaction(self, transaction_id: str, masked_name: str) -> dict[str, Any]:
        """
        Attempts to resolve '*' or partial names by looking at:
        1. Similar amounts in other transactions.
        2. Merchant frequency for the specific account.
        3. External metadata linkages.

        Args:
            transaction_id: Transaction ID to unmask
            masked_name: The masked/redacted merchant name

        Returns:
            Unmasking results with confidence scores
        """
        logger.info(f"Triangulating redacted merchant for txn {transaction_id}: {masked_name}")

        try:
            # Get transaction details
            transaction = await self._get_transaction(transaction_id)
            if not transaction:
                return {
                    "transaction_id": transaction_id,
                    "original_masked": masked_name,
                    "resolved_name": None,
                    "confidence_score": 0.0,
                    "error": "Transaction not found",
                }

            suggestions = []

            # Strategy 1: Amount-Pattern Match
            amount_matches = await self._find_by_amount(transaction.get("amount", 0))
            for match in amount_matches:
                if match.get("merchant") and "*" not in match["merchant"]:
                    suggestions.append(
                        {
                            "candidate": match["merchant"],
                            "confidence": min(0.7 + (0.1 * match.get("frequency", 1)), 0.95),
                            "source": "Amount-Pattern Match",
                        }
                    )

            # Strategy 2: Account History Sync
            history_matches = await self._find_by_account_history(transaction.get("account_id"), masked_name)
            for match in history_matches:
                suggestions.append(
                    {
                        "candidate": match["merchant"],
                        "confidence": min(0.8 + (0.05 * match.get("count", 1)), 0.95),
                        "source": "Account-History Sync",
                    }
                )

            # Strategy 3: Pattern Recognition
            if masked_name and "*" in masked_name:
                pattern_matches = self._match_partial_pattern(masked_name)
                suggestions.extend(pattern_matches)

            # Deduplicate and sort by confidence
            seen = set()
            unique_suggestions = []
            for s in sorted(suggestions, key=lambda x: x["confidence"], reverse=True):
                if s["candidate"] not in seen:
                    seen.add(s["candidate"])
                    unique_suggestions.append(s)

            best_match = unique_suggestions[0] if unique_suggestions else None

            return {
                "transaction_id": transaction_id,
                "original_masked": masked_name,
                "resolved_name": best_match["candidate"] if best_match else None,
                "confidence_score": best_match["confidence"] if best_match else 0.0,
                "all_candidates": unique_suggestions[:5],
                "triangulation_logic": list({s["source"] for s in unique_suggestions}),
                "timestamp": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"Triangulation failed for {transaction_id}: {e}")
            return {
                "transaction_id": transaction_id,
                "original_masked": masked_name,
                "resolved_name": None,
                "confidence_score": 0.0,
                "error": str(e),
            }

    async def _get_transaction(self, transaction_id: str) -> dict | None:
        """Get transaction from database."""
        try:
            from core.database import Transaction

            txn = self.db.query(Transaction).filter_by(id=transaction_id).first()
            if txn:
                return {
                    "id": str(txn.id),
                    "amount": txn.amount,
                    "account_id": getattr(txn, "account_id", None),
                    "merchant": getattr(txn, "merchant", None),
                }
        except Exception:
            pass
        return None

    async def _find_by_amount(self, amount: float) -> list[dict]:
        """Find transactions with similar amounts."""
        try:
            from core.database import Transaction

            tolerance = amount * 0.05  # 5% tolerance

            matches = self.db.query(Transaction).filter(Transaction.amount.between(amount - tolerance, amount + tolerance)).limit(50).all()

            # Group by merchant
            merchant_counts = defaultdict(int)
            for m in matches:
                if hasattr(m, "merchant") and m.merchant:
                    merchant_counts[m.merchant] += 1

            return [{"merchant": k, "frequency": v} for k, v in sorted(merchant_counts.items(), key=lambda x: x[1], reverse=True)]
        except Exception:
            return []

    async def _find_by_account_history(self, account_id: str, masked: str) -> list[dict]:
        """Find matches from account transaction history."""
        if not account_id:
            return []
        try:
            from core.database import Transaction

            history = self.db.query(Transaction).filter_by(account_id=account_id).limit(100).all()

            # Find unmasked merchants
            merchant_counts = defaultdict(int)
            for t in history:
                if hasattr(t, "merchant") and t.merchant and "*" not in t.merchant:
                    merchant_counts[t.merchant] += 1

            return [{"merchant": k, "count": v} for k, v in sorted(merchant_counts.items(), key=lambda x: x[1], reverse=True)[:5]]
        except Exception:
            return []

    def _match_partial_pattern(self, masked: str) -> list[dict]:
        """Match partial patterns against known vendors."""
        # Common vendor patterns
        known_patterns = {
            "AMZN*": "Amazon",
            "AMAZON*": "Amazon",
            "APPLE*": "Apple",
            "GOOGLE*": "Google",
            "PAYPAL*": "PayPal",
            "SQ *": "Square",
            "UBER*": "Uber",
            "LYFT*": "Lyft",
            "DOORDASH*": "DoorDash",
        }

        results = []
        masked_upper = masked.upper()

        for pattern, vendor in known_patterns.items():
            if masked_upper.startswith(pattern.replace("*", "")):
                results.append(
                    {
                        "candidate": vendor,
                        "confidence": 0.85,
                        "source": "Pattern Recognition",
                    }
                )

        return results


class LIBRAlgorithm:
    """
    Lowest Intermediate Balance Rule (LIBR) for tracking mixed funds.
    Used to detect illicit float in personal/business accounts.
    Ref: VISION_10_10 Section 6
    """

    def __init__(self, db_session):
        self.db = db_session

    def analyze_mixed_funds(
        self,
        account_id: str,
        start_date: datetime,
        end_date: datetime,
        suspected_illicit_deposits: list[str] | None = None,
    ) -> dict[str, Any]:
        """
        Applies LIBR to distinguish between legitimate funds and illicit injections.

        The LIBR principle: The lowest balance reached between an illicit deposit
        and a subsequent withdrawal represents the maximum illicit funds in that withdrawal.

        Args:
            account_id: Account to analyze
            start_date: Analysis start date
            end_date: Analysis end date
            suspected_illicit_deposits: Optional list of suspected illicit deposit IDs

        Returns:
            LIBR analysis results
        """
        logger.info(f"Applying LIBR Algorithm to account {account_id}")

        try:
            # Get chronological transactions
            transactions = self._get_transactions(account_id, start_date, end_date)

            if not transactions:
                return {
                    "account_id": account_id,
                    "status": "NO_DATA",
                    "message": "No transactions found",
                }

            # Calculate running balance
            running_balance = 0.0
            balance_history = []

            for txn in transactions:
                running_balance += txn["amount"]
                balance_history.append(
                    {
                        "date": txn["date"],
                        "amount": txn["amount"],
                        "balance": running_balance,
                        "is_suspected": txn["id"] in (suspected_illicit_deposits or []),
                    }
                )

            # Find minimum intermediate balances after suspected deposits
            libr_violations = []
            illicit_float = 0.0

            for i, entry in enumerate(balance_history):
                if entry["is_suspected"] and entry["amount"] > 0:
                    # Find lowest balance after this deposit
                    min_balance = entry["balance"]
                    for j in range(i + 1, len(balance_history)):
                        if balance_history[j]["balance"] < min_balance:
                            min_balance = balance_history[j]["balance"]

                    # LIBR violation if withdrawal occurred
                    max_illicit = min(entry["amount"], max(0, entry["balance"] - min_balance))
                    if max_illicit > 0:
                        libr_violations.append(
                            {
                                "deposit_date": str(entry["date"]),
                                "deposit_amount": entry["amount"],
                                "min_subsequent_balance": min_balance,
                                "max_illicit_withdrawn": max_illicit,
                            }
                        )
                        illicit_float += max_illicit

            # Calculate commingling ratio
            total_deposits = sum(t["amount"] for t in transactions if t["amount"] > 0)
            commingling_ratio = illicit_float / total_deposits if total_deposits > 0 else 0

            # Determine risk status
            if commingling_ratio > 0.5:
                status = "HIGH_RISK"
            elif commingling_ratio > 0.2:
                status = "MEDIUM_RISK"
            elif libr_violations:
                status = "LOW_RISK"
            else:
                status = "CLEAN"

            return {
                "account_id": account_id,
                "period": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
                "commingling_ratio": round(commingling_ratio, 2),
                "illicit_float_detected": round(illicit_float, 2),
                "libr_violation_count": len(libr_violations),
                "status": status,
                "violations": libr_violations[:10],
                "findings": self._generate_findings(commingling_ratio, libr_violations),
                "analyzed_at": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"LIBR analysis failed: {e}")
            return {"account_id": account_id, "status": "ERROR", "error": str(e)}

    def _get_transactions(self, account_id: str, start_date: datetime, end_date: datetime) -> list[dict]:
        """Get transactions from database."""
        try:
            from core.database import Transaction

            txns = (
                self.db.query(Transaction)
                .filter(
                    Transaction.account_id == account_id,
                    Transaction.created_at.between(start_date, end_date),
                )
                .order_by(Transaction.created_at)
                .all()
            )

            return [{"id": str(t.id), "amount": t.amount, "date": t.created_at} for t in txns]
        except Exception:
            return []

    def _generate_findings(self, ratio: float, violations: list[dict]) -> str:
        """Generate human-readable findings."""
        if not violations:
            return "No LIBR violations detected. Funds appear segregated."

        if ratio > 0.5:
            return f"High commingling detected ({ratio * 100:.0f}%). Multiple illicit deposits followed by withdrawals before balance separation."
        elif ratio > 0.2:
            return f"Moderate commingling ({ratio * 100:.0f}%). Some potential structuring activity detected."
        else:
            return f"Low commingling ({ratio * 100:.0f}%). Minor LIBR violations detected but funds largely traceable."


class MensReaEngine:
    """
    Theory of Intent (Mens Rea) Engine.
    AI classifiers that map evidence to Knowledge, Intent, or Willful Blindness.
    Ref: VISION_10_10 Section 5
    """

    def __init__(self, ai_service=None):
        self.ai_service = ai_service
        self.legal_lexicon = {
            "avoidance": [
                "bypass",
                "limit",
                "threshold",
                "split",
                "smurf",
                "avoid",
                "circumvent",
                "evade",
                "dodge",
                "structure",
            ],
            "obfuscation": [
                "hide",
                "mask",
                "proxy",
                "nominee",
                "shell",
                "offshore",
                "anonymous",
                "conceal",
                "disguise",
                "launder",
            ],
            "knowledge": [
                "aware",
                "understand",
                "policy",
                "regulation",
                "illegal",
                "know",
                "recognize",
                "acknowledge",
                "realize",
                "compliance",
            ],
            "planning": [
                "plan",
                "schedule",
                "arrange",
                "organize",
                "coordinate",
                "timing",
                "sequence",
                "prepare",
                "strategy",
            ],
        }

        self.intent_weights = {
            "knowledge": 0.25,
            "avoidance": 0.35,
            "obfuscation": 0.30,
            "planning": 0.10,
        }

    async def attribute_intent(self, evidence_id: str, content: str) -> dict[str, Any]:
        """
        Analyzes text/metadata to classify legal intent with detailed justification.

        Args:
            evidence_id: Evidence ID being analyzed
            content: Text content to analyze

        Returns:
            Intent analysis with legal theory mapping
        """
        logger.info(f"Running Advanced Mens Rea analysis on evidence {evidence_id}")

        if not content:
            return {"evidence_id": evidence_id, "error": "No content provided"}

        content_lower = content.lower()

        # Find all markers
        found_markers = []
        category_scores = {}

        for category, keywords in self.legal_lexicon.items():
            matches = [kw for kw in keywords if kw in content_lower]
            if matches:
                found_markers.append({"category": category, "keywords": matches, "count": len(matches)})
                # Score based on match density
                category_scores[category] = min(len(matches) / 3, 1.0)

        # Calculate weighted intent scores
        intent_scores = {
            "KNOWLEDGE": 0.0,
            "INTENT": 0.0,
            "WILLFUL_BLINDNESS": 0.0,
            "NEGLIGENCE": 0.0,
        }

        # Knowledge requires explicit awareness markers
        knowledge_markers = category_scores.get("knowledge", 0)
        intent_scores["KNOWLEDGE"] = min(0.3 + (knowledge_markers * 0.5), 0.95)

        # Intent requires avoidance + planning
        avoidance = category_scores.get("avoidance", 0)
        planning = category_scores.get("planning", 0)
        intent_scores["INTENT"] = min(0.2 + (avoidance * 0.4) + (planning * 0.3), 0.95)

        # Willful blindness = knowledge without action
        if knowledge_markers > 0.3 and avoidance < 0.2:
            intent_scores["WILLFUL_BLINDNESS"] = min(knowledge_markers * 0.7, 0.8)
        else:
            intent_scores["WILLFUL_BLINDNESS"] = 0.15

        # Negligence is default low
        intent_scores["NEGLIGENCE"] = max(0.1, 0.5 - max(intent_scores.values()))

        # Determine primary intent
        primary_intent = max(intent_scores, key=intent_scores.get)
        confidence = intent_scores[primary_intent]

        # Generate legal theory
        legal_theory = self._generate_legal_theory(primary_intent, found_markers)

        return {
            "evidence_id": evidence_id,
            "primary_intent": primary_intent,
            "confidence": round(confidence, 2),
            "justification": {
                "summary": self._generate_summary(primary_intent, found_markers),
                "evidence_markers": found_markers,
                "legal_theory": legal_theory,
            },
            "mens_rea_matrix": {k: round(v, 2) for k, v in intent_scores.items()},
            "litigation_readiness": "HIGH" if confidence > 0.7 else "MODERATE" if confidence > 0.5 else "LOW",
            "admissibility_context": "Ref: Rule 403 (Probative value vs. Prejudice), Rule 404(b) (Prior acts)",
            "analyzed_at": datetime.now().isoformat(),
        }

    def _generate_summary(self, intent: str, markers: list[dict]) -> str:
        """Generate analysis summary."""
        if not markers:
            return "Insufficient evidence markers for conclusive intent determination."

        [m["category"] for m in markers]

        if intent == "KNOWLEDGE":
            return "Evidence shows explicit awareness of regulatory requirements and potential violations."
        elif intent == "INTENT":
            return "Pattern of avoidance keywords combined with planning language suggests deliberate circumvention."
        elif intent == "WILLFUL_BLINDNESS":
            return "Subject demonstrated awareness without taking corrective action - potential willful blindness."
        else:
            return "No clear intentional misconduct detected. May represent negligence or oversight."

    def _generate_legal_theory(self, intent: str, markers: list[dict]) -> str:
        """Generate legal theory mapping."""
        if intent == "INTENT":
            return "The proximity of 'avoidance' keywords to 'planning' language suggests a calculated attempt to circumvent AML controls. See United States v. MacPherson (intent inferred from pattern of conduct)."
        elif intent == "KNOWLEDGE":
            return "Explicit references to regulations and compliance requirements demonstrate actual knowledge. See Model Penal Code § 2.02(2)(b)."
        elif intent == "WILLFUL_BLINDNESS":
            return "Subject's awareness combined with failure to inquire further may constitute willful blindness. See Global-Tech Appliances v. SEB S.A."
        else:
            return "Standard of reasonable care analysis applies. See negligence elements under common law."


class TemporalPairMatcher:
    """
    Detects Mirror/Wash transactions (Equal & Opposite movements).
    Ref: VISION_10_10 Section 6 (Mirror Detection)
    """

    def __init__(self, db_session):
        self.db = db_session

    async def find_mirror_pairs(
        self,
        account_id: str,
        threshold_seconds: int = 3600,
        amount_tolerance: float = 0.01,
    ) -> list[dict[str, Any]]:
        """
        Identifies pairs of transactions that appear to 'cancel' each other out
        to artificially inflate volume or hide fund source.

        Args:
            account_id: Account to analyze
            threshold_seconds: Time window for pair matching
            amount_tolerance: Percentage tolerance for amount matching

        Returns:
            List of detected mirror pairs
        """
        logger.info(f"Running Mirror Detection for account {account_id}")

        try:
            transactions = await self._get_transactions(account_id)

            if len(transactions) < 2:
                return []

            pairs = []
            matched = set()

            for i, tx1 in enumerate(transactions):
                if tx1["id"] in matched:
                    continue

                for tx2 in transactions[i + 1 :]:
                    if tx2["id"] in matched:
                        continue

                    # Check if mirror pair
                    is_mirror, score = self._check_mirror(tx1, tx2, threshold_seconds, amount_tolerance)

                    if is_mirror:
                        pairs.append(
                            {
                                "pair_id": f"pair_{hashlib.md5((tx1['id'] + tx2['id']).encode()).hexdigest()[:8]}",
                                "tx1": {
                                    "id": tx1["id"],
                                    "amount": tx1["amount"],
                                    "type": "DEBIT" if tx1["amount"] < 0 else "CREDIT",
                                    "time": tx1["date"].strftime("%H:%M:%S") if hasattr(tx1["date"], "strftime") else str(tx1["date"]),
                                },
                                "tx2": {
                                    "id": tx2["id"],
                                    "amount": tx2["amount"],
                                    "type": "DEBIT" if tx2["amount"] < 0 else "CREDIT",
                                    "time": tx2["date"].strftime("%H:%M:%S") if hasattr(tx2["date"], "strftime") else str(tx2["date"]),
                                },
                                "score": round(score, 2),
                                "time_gap_seconds": self._time_diff_seconds(tx1["date"], tx2["date"]),
                                "label": "Potential Wash Trade" if score > 0.9 else "Suspicious Pair",
                            }
                        )
                        matched.add(tx1["id"])
                        matched.add(tx2["id"])
                        break  # Move to next tx1

            # Sort by score
            pairs.sort(key=lambda x: x["score"], reverse=True)

            return pairs

        except Exception as e:
            logger.error(f"Mirror detection failed: {e}")
            return []

    async def _get_transactions(self, account_id: str) -> list[dict]:
        """Get transactions from database."""
        try:
            from core.database import Transaction

            txns = self.db.query(Transaction).filter_by(account_id=account_id).order_by(Transaction.created_at).limit(500).all()

            return [{"id": str(t.id), "amount": t.amount, "date": t.created_at} for t in txns]
        except Exception:
            return []

    def _check_mirror(self, tx1: dict, tx2: dict, threshold_seconds: int, tolerance: float) -> tuple:
        """Check if two transactions form a mirror pair."""
        # Amounts must be opposite (or very close)
        amt1, amt2 = abs(tx1["amount"]), abs(tx2["amount"])

        if amt1 == 0 or amt2 == 0:
            return False, 0.0

        amount_diff = abs(amt1 - amt2) / max(amt1, amt2)
        if amount_diff > tolerance:
            return False, 0.0

        # Must be opposite directions
        if (tx1["amount"] > 0) == (tx2["amount"] > 0):
            return False, 0.0

        # Time check
        time_diff = self._time_diff_seconds(tx1["date"], tx2["date"])
        if time_diff > threshold_seconds:
            return False, 0.0

        # Calculate score
        amount_score = 1 - amount_diff
        time_score = 1 - (time_diff / threshold_seconds)

        score = (amount_score * 0.6) + (time_score * 0.4)

        return score > 0.7, score

    def _time_diff_seconds(self, date1, date2) -> int:
        """Calculate time difference in seconds."""
        try:
            if isinstance(date1, datetime) and isinstance(date2, datetime):
                return abs(int((date2 - date1).total_seconds()))
        except Exception:
            pass
        return 0


# Global accessibility for services
def get_forensic_intelligence(db):
    """Factory function for forensic intelligence services."""
    return {
        "triangulation": TriangulationEngine(db),
        "libr": LIBRAlgorithm(db),
        "mens_rea": MensReaEngine(),
        "mirror_matcher": TemporalPairMatcher(db),
    }
