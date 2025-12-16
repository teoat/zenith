# Fraud Typology: Ghost Employees (Payroll Fraud)

## Definition

A "Ghost Employee" is a fictitious person added to the payroll system, or a real former employee kept on payroll, to siphon funds.

## Indicators & Red Flags

- **Shared Bank Account**: Multiple employees listing the same direct deposit account number.
- **Audit Log Anomalies**: Payroll file edits made outside standard hours or by unauthorized users.
- **Missing PII**: Employees with missing SSN, address, or emergency contacts.
- **No Physical Presence**: Employee never logs into VPN, badges into office, or sends emails.

## Detection Logic

- **Shared Credential**: `Count(Employees per Bank Account) > 1`.
- **Net Pay Analysis**: Exact duplicate net pay amounts for different employees.

## Response

- Verify existence of employee (ID check, manager interview).
- Audit who added the employee to the system.
- Trace flow of funds from the shared bank account.
