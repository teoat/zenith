# Emerging Typology: Authorized Push Payment (APP) Fraud

## Definition
APP Fraud occurs when a criminal tricks a victim into knowingly transferring money to an account controlled by the criminal. Unlike "unauthorized" fraud (hacks), the customer *authorizes* the payment, making detection harder.

## Common Variants
1.  **CEO Fraud / BEC**: Impersonating an executive to request an urgent wire.
2.  **Impersonation**: Pretending to be Bank Fraud Dept, Police, or IRS.
3.  **Investment Scams**: Fake opportunities.

## Indicators & Red Flags

- **Urgency**: "You must act now or you will be arrested/lose money."
- **Secrecy**: "Do not tell anyone, it is an undercover investigation."
- **Live Guidance**: Victim is on a long phone call while navigating online banking (RAT / Coached).
- **New Payee**: Large transfer to a brand new beneficiary.

## Detection Logic

- **Session Biometrics**: Detect "Long Live Call" (telephony integration) or Remote Access Tool (RAT) usage during session.
- **New Payee Anomaly**: `New Payee` + `High Value` (> $1k) + `Immediate Send`.
- **Dormant Account**: Inactive account suddenly used receiving high value funds.

## Response
- **Confirmation Prompts**: "Stop! Are you on the phone with someone telling you to do this?"
- **Cooling-off Period**: Delay high-value new payee payments by 1-24 hours.
