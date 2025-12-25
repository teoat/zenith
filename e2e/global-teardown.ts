// e2e/global-teardown.ts
import { cleanupTestDatabase } from './utils/database-setup';

async function globalTeardown() {
  console.log('🧹 Cleaning up E2E test environment...');

  try {
    console.log('🗑️ Cleaning up test database...');
    await cleanupTestDatabase();

    console.log('✅ E2E test environment cleanup complete');
  } catch (error) {
    console.error('❌ Failed to cleanup E2E test environment:', error);
    // Don't throw here to avoid masking test failures
  }
}

export default globalTeardown;