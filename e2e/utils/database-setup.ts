// e2e/utils/database-setup.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Setup test database for E2E tests
 */
export async function setupTestDatabase(): Promise<void> {
  try {
    // For E2E tests, we'll use a separate test database
    // In a real scenario, this would set up a test database instance
    console.log('Setting up test database...');

    // You could run database migrations or setup scripts here
    // For now, we'll just ensure the backend can start
    const backendPath = path.join(process.cwd(), 'backend');

    // Check if backend dependencies are installed
    const venvPython = process.platform === 'win32' 
      ? path.join('venv', 'Scripts', 'python.exe')
      : path.join('venv', 'bin', 'python');
      
    const pythonCmd = require('fs').existsSync(path.join(backendPath, venvPython))
      ? venvPython
      : 'python';

    try {
      await execAsync(`cd backend && ${pythonCmd} -c "import fastapi, sqlalchemy, uvicorn, networkx; print('Dependencies OK')"`);
    } catch (error) {
      console.log('Installing backend dependencies...');
      const pipCmd = pythonCmd === 'python' ? 'pip' : path.join(path.dirname(pythonCmd), 'pip');
      await execAsync(`cd backend && ${pipCmd} install -r requirements.txt`);
    }

    console.log('Test database setup complete');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

/**
 * Cleanup test database after E2E tests
 */
export async function cleanupTestDatabase(): Promise<void> {
  try {
    console.log('Cleaning up test database...');
    // Add cleanup logic here if needed
    console.log('Test database cleanup complete');
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
    // Don't throw here to avoid masking test failures
  }
}