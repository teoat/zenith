import React from 'react';
import { ProcessedFileData } from '@/types/ingestion';
import { TableData } from '@/types/api';

interface ProcessingResultDetailsProps {
  result: ProcessedFileData;
}

const renderTable = (table: TableData) => (
  <div className="overflow-x-auto my-4">
    <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg">
      <thead className="bg-gray-50">
        <tr>
          {table.headers.map((header, idx) => (
            <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {table.rows.map((row, rowIdx) => (
          <tr key={rowIdx}>
            {row.map((cell, cellIdx) => (
              <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const ProcessingResultDetails: React.FC<ProcessingResultDetailsProps> = ({ result }) => {
  return (
    <div className="result-details mt-4 p-4 border rounded-md bg-gray-50 dark:bg-slate-800">
      <div className="detail-grid grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="detail-item">
          <span className="label font-semibold">File Type:</span>
          <span className="value ml-2">{result.fileType}</span>
        </div>
        <div className="detail-item">
          <span className="label font-semibold">Size:</span>
          <span className="value ml-2" aria-label={`${result.sizeBytes} bytes`}>
            {result.sizeBytes}
          </span>
        </div>

        {result.document_type && (
          <div className="detail-item md:col-span-2">
            <span className="label font-semibold">Document Type:</span>
            <span className="value ml-2 capitalize">{result.document_type.replace(/_/g, ' ')}</span>
          </div>
        )}

        {result.ocrText && (
          <div className="detail-item md:col-span-2">
            <span className="label font-semibold">OCR Text (excerpt):</span>
            <div
              className="value ocr-text mt-1 p-2 bg-white border rounded text-sm max-h-24 overflow-y-auto"
              aria-label="Extracted text content"
            >
              {result.ocrText.substring(0, 500)}...
            </div>
          </div>
        )}

        {result.bank_statement_data && result.document_type === "bank_statement" && (
          <div className="detail-item md:col-span-1 border-r pr-4">
            <h3 className="text-lg font-bold mb-2">Bank Statement Data</h3>
            {result.bank_statement_data.account_summary && (
              <div className="mb-2">
                <p className="font-semibold">Account Summary:</p>
                {Object.entries(result.bank_statement_data.account_summary).map(([key, value]) => (
                  <p key={key} className="text-sm capitalize">{key.replace(/_/g, ' ')}: {String(value)}</p>
                ))}
              </div>
            )}
            {result.bank_statement_data.transactions && result.bank_statement_data.transactions.length > 0 && (
              <div>
                <p className="font-semibold mb-1">Transactions:</p>
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.bank_statement_data.transactions.map((txn: any, txnIdx: number) => (
                        <tr key={txnIdx}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{txn.date}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{txn.description}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{txn.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {result.expense_data && result.document_type === "expense_report" && (
          <div className="detail-item md:col-span-1 pl-4">
            <h3 className="text-lg font-bold mb-2">Expense Data</h3>
            {result.expense_data.total_amount && (
              <p className="font-semibold mb-2">Total Amount: {result.expense_data.total_amount}</p>
            )}
            {result.expense_data.items && result.expense_data.items.length > 0 && (
              <div>
                <p className="font-semibold mb-1">Expense Items:</p>
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.expense_data.items.map((item: any, itemIdx: number) => (
                        <tr key={itemIdx}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.item}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.amount}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {result.extracted_tables && result.extracted_tables.length > 0 && result.document_type === "general_document" && (
          <div className="detail-item md:col-span-2">
            <h3 className="text-lg font-bold mb-2">Extracted Tables</h3>
            {result.extracted_tables.map((table, tableIdx) => (
              <div key={tableIdx} className="mb-4 p-2 border rounded bg-white">
                {renderTable(table)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
