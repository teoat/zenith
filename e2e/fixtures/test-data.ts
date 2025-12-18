// e2e/fixtures/test-data.ts
/**
 * Test data fixtures for E2E tests
 */

export const TEST_USERS = {
  analyst: {
    username: 'analyst@378x492.com',
    email: 'analyst@378x492.com',
    password: 'Test123!',
    fullName: 'Test Analyst',
    role: 'analyst'
  },
  admin: {
    username: 'test_admin',
    email: 'admin@test.com',
    password: 'AdminPass123!',
    fullName: 'Test Admin',
    role: 'admin'
  }
};

export const TEST_CASES = {
  fraudCase: {
    title: 'Test Fraud Case - E2E',
    description: 'This is a test case created during E2E testing',
    priority: 'high',
    caseType: 'fraud_suspected',
    customerName: 'John Doe',
    fraudAmount: 5000.00
  },
  investigationCase: {
    title: 'Investigation Test Case',
    description: 'Case for testing investigation workflows',
    priority: 'medium',
    caseType: 'suspicious_activity',
    customerName: 'Jane Smith',
    fraudAmount: 2500.00
  }
};

export const TEST_TRANSACTIONS = {
  suspicious: {
    amount: 9999.99,
    merchant: 'High Risk Merchant',
    description: 'Large suspicious transaction',
    transactionType: 'DEBIT'
  },
  normal: {
    amount: 49.99,
    merchant: 'Normal Store',
    description: 'Regular purchase',
    transactionType: 'DEBIT'
  }
};

export const TEST_EVIDENCE = {
  document: {
    filename: 'test-document.pdf',
    content: 'Test document content for E2E testing',
    type: 'document'
  },
  image: {
    filename: 'test-image.png',
    content: 'Mock image data',
    type: 'image'
  }
};