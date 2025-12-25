// e2e/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';
import { setupTestDatabase } from './utils/database-setup';
import { setupTestUsers } from './utils/user-setup';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');

  // Setup test database and seed data
  try {
    console.log('📊 Setting up test database...');
    await setupTestDatabase();

    console.log('👥 Setting up test users...');
    await setupTestUsers();

    console.log('✅ E2E test environment setup complete');
  } catch (error) {
    console.error('❌ Failed to setup E2E test environment:', error);
    throw error;
  }
}

export default globalSetup;