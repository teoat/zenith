# Money Laundering Typology: Layering

## Definition

Layering is the second stage of money laundering, where the illicit origin of funds is disguised through a series of complex financial transactions. The goal is to separate the money from its criminal source and make it difficult to trace.

## Indicators & Red Flags

- **Rapid Movement**: Funds are transferred out immediately after being received (Pass-through).
- **Complex Web**: Multiple transfers between related accounts or shell companies.
- **Round Tripping**: Funds sent to another jurisdiction and returned disguised as "foreign investment".
- **Account Usage**: Personal accounts used for business-like volume, or business accounts used for unrelated purposes.
- **Inconsistent Velocity**: Transaction frequency that does not match the customer's profile.

## Detection Logic

- **Retention Time**: `Time(Credit) - Time(Debit) < 1 hour`
- **Flow Ratio**: `Total Credits ≈ Total Debits` (Account balance remains near zero despite high volume)

## Response

- File Suspicious Activity Report (SAR).
- Request explanation for specific "pass-through" transactions.
- Analyze counter-parties for links to known high-risk entities.
