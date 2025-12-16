# Money Laundering Typology: Money Mule

## Definition

A Money Mule is a person who transfers illegally acquired money on behalf of others. Mules can be "witting" (complicit) or "unwitting" (victims of romance scams or fake job offers).

## Types

1.  **Unwitting Mule**: Believes they are helping a friend or doing a legitimate job (e.g., "Payment Processor").
2.  **Witting Mule**: Ignores red flags but doesn't ask questions.
3.  **Complicit Mule**: Actively participates in the criminal network.

## Indicators & Red Flags

- **New Account Spike**: Brand new account suddenly receiving large transfers.
- **Flow-Through Activity**: Immediate withdrawal of funds via cash, wire, or crypto after receipt.
- **Unusual Source**: funds from unrelated third parties (unknown individuals or unrelated businesses).
- **Behavioral Shift**: Dormant account suddenly becoming active.
- **Demographic Mismatch**: Student or elderly person transacting business-level volumes.

## Detection Logic

- **Mule Profile**: `High Velocity` + `Low Balance Retention` + ` unrelated senders`.
- **Flow Ratio**: `Total Credits ≈ Total Debits` (within 5% margin).

## Response

- Freeze account to prevent funds egress.
- Contact customer to verify "job" or "relationship" (often reveals unwitting status).
- Return funds to source bank if possible.
