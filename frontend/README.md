# 378x492 Frontend

This is the frontend application for the 378x492 Fraud Detection Platform.

## Data Ingestion Wizard

The Ingestion page (`/ingestion`) features a 3-step wizard for uploading and normalizing financial data:

1.  **Upload Files**: Drag and drop CSV, Excel, PDF, or Image files.
2.  **Map Columns**: For structured files (CSV/Excel), map the columns from your file to the system's standard fields (Date, Amount, Description, etc.) using a simple drag-and-drop interface.
3.  **Review & Submit**: Verify the mapping results and submit the data for reconciliation.

### Supported System Fields

- **Transaction Date** (Required)
- **Amount** (Required)
- **Description** (Required)
- Merchant / Payee
- Category
- Currency

## Getting Started

1.  Install dependencies: `npm install`
2.  Run development server: `npm run dev`
