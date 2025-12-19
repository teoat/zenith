// e2e/utils/user-setup.ts
/**
 * Setup test users for E2E tests
 */
import { TEST_USERS } from '../fixtures/test-data';

export async function setupTestUsers(): Promise<void> {
  try {
    console.log('Setting up test users...');

    const baseUrl = process.env.BASE_URL || 'http://localhost:5176';

    // Extract backend URL from frontend URL (assuming backend is on port 8000)
    const backendUrl = baseUrl.replace(/:\d+$/, ':8000');

    console.log(`Creating test users via backend at ${backendUrl}...`);

    // Create analyst user
    try {
      const analystResponse = await fetch(`${backendUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: TEST_USERS.analyst.username,
          email: TEST_USERS.analyst.email,
          password: TEST_USERS.analyst.password,
          full_name: TEST_USERS.analyst.fullName,
          role: 'analyst'
        })
      });

      if (analystResponse.ok) {
        console.log(`✅ Created analyst user: ${TEST_USERS.analyst.email}`);
      } else {
        const error = await analystResponse.text();
        console.log(`⚠️  Analyst user may already exist: ${error}`);
      }
    } catch (error) {
      console.log(`⚠️  Failed to create analyst user: ${error}`);
    }

    // Create admin user
    try {
      const adminResponse = await fetch(`${backendUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: TEST_USERS.admin.username,
          email: TEST_USERS.admin.email,
          password: TEST_USERS.admin.password,
          full_name: TEST_USERS.admin.fullName,
          role: 'admin'
        })
      });

      if (adminResponse.ok) {
        console.log(`✅ Created admin user: ${TEST_USERS.admin.email}`);
      } else {
        const error = await adminResponse.text();
        console.log(`⚠️  Admin user may already exist: ${error}`);
      }
    } catch (error) {
      console.log(`⚠️  Failed to create admin user: ${error}`);
    }

    console.log('Test users setup complete');

  } catch (error) {
    console.error('Failed to setup test users:', error);
    throw error;
  }
}