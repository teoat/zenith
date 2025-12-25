# Money Laundering Typology: Structuring (Smurfing)

## Definition

Structuring involves breaking down large cash transactions into smaller amounts to avoid triggering mandatory reporting thresholds (e.g., the $10,000 CTR limit in the US).

## Indicators & Red Flags

- **Just Below Threshold**: Multiple deposits of $9,000 - $9,900.
- **Multiple Locations**: Deposits made at different branches or ATMs on the same day.
- **Frequent Cash**: Patterns of cash deposits that deviate from normal business practice.
- **Reaction to Questions**: Customer reduces amount after being asked for ID.

## Detection Logic

- **Volume Rule**: `Count(Transactions between $9k-$10k) > 2` in 7 days.
- **Aggregated rule**: `Sum(Cash Transactions) > $10k` but individual `Max(Txn) < $10k`.

## Response

- Immediate SAR filing (Structuring is a crime in itself, regardless of source of funds).
- Do NOT tip off the customer.
