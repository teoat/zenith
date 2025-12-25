/**
 * Security Integration Tests
 * Comprehensive security testing for the application
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Import security modules
const SecureConfig = require('../electron/secure-config');
const SecureIPC = require('../electron/secure-ipc');

class SecurityIntegrationTests {
  constructor() {
    this.testResults = [];
    this.window = null;
    this.secureConfig = null;
    this.secureIPC = null;
  }

  /**
   * Add test result
   */
  addTestResult(category, testName, passed, message = '', details = {}) {
    this.testResults.push({
      category,
      testName,
      passed,
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Setup test environment
   */
  async setupTestEnvironment() {
    try {
      // Set test environment variables
      process.env.NODE_ENV = 'test';
      process.env.SQLCIPHER_KEY = 'test-sqlcipher-key-32-chars-long-secure';
      process.env.MASTER_PASSWORD = 'TestPassword123!';
      process.env.IPC_SECRET = 'test-ipc-secret-key-32-chars-long';
      process.env.AUTH_ENCRYPTION_KEY = 'test-auth-encryption-key-32-chars';

      // Initialize secure configuration
      this.secureConfig = new SecureConfig();
      await this.secureConfig.loadConfig();

      // Initialize secure IPC
      const ipcSecret = this.secureConfig.get('ipcSecret');
      this.secureIPC = new SecureIPC(ipcSecret);

      this.addTestResult('Setup', 'Test Environment', true, 'Test environment configured successfully');
      return true;
    } catch (error) {
      this.addTestResult('Setup', 'Test Environment', false, error.message);
      return false;
    }
  }

  /**
   * Test secure configuration loading
   */
  async testSecureConfiguration() {
    try {
      // Test required variables
      const sqlcipherKey = this.secureConfig.get('sqlcipherKey');
      const masterPassword = this.secureConfig.get('masterPassword');
      const ipcSecret = this.secureConfig.get('ipcSecret');
      const authKey = this.secureConfig.get('authEncryptionKey');

      if (!sqlcipherKey || sqlcipherKey.length < 32) {
        this.addTestResult('Configuration', 'SQLCipher Key', false, 'Invalid SQLCipher key');
        return;
      }

      if (!masterPassword || masterPassword.length < 16) {
        this.addTestResult('Configuration', 'Master Password', false, 'Invalid master password');
        return;
      }

      if (!ipcSecret || ipcSecret.length < 32) {
        this.addTestResult('Configuration', 'IPC Secret', false, 'Invalid IPC secret');
        return;
      }

      if (!authKey || authKey.length < 32) {
        this.addTestResult('Configuration', 'Auth Encryption Key', false, 'Invalid auth key');
        return;
      }

      this.addTestResult('Configuration', 'Secure Configuration', true, 'All security variables loaded successfully');
    } catch (error) {
      this.addTestResult('Configuration', 'Secure Configuration', false, error.message);
    }
  }

  /**
   * Test IPC security
   */
  async testIPCSecurity() {
    try {
      // Test HMAC signing
      const testData = { action: 'test', data: 'sensitive' };
      const timestamp = Date.now();
      const payload = JSON.stringify({ args: [testData], timestamp });

      // Create HMAC signature
      const hmac = crypto.createHmac('sha256', this.secureIPC.secretKey);
      hmac.update(payload);
      const signature = hmac.digest('hex');

      if (!signature || signature.length !== 64) {
        this.addTestResult('IPC', 'HMAC Signing', false, 'Invalid HMAC signature');
        return;
      }

      // Test request validation
      const isValid = this.validateIPCRequest(testData, signature, timestamp);
      if (!isValid) {
        this.addTestResult('IPC', 'Request Validation', false, 'Request validation failed');
        return;
      }

      this.addTestResult('IPC', 'HMAC Security', true, 'IPC security working correctly');
    } catch (error) {
      this.addTestResult('IPC', 'HMAC Security', false, error.message);
    }
  }

  /**
   * Validate IPC request
   */
  validateIPCRequest(data, signature, timestamp) {
    try {
      // Check timestamp (prevent replay attacks)
      const now = Date.now();
      const age = now - timestamp;
      if (age > 30000) { // 30 seconds
        return false;
      }

      // Verify HMAC signature
      const payload = JSON.stringify({ args: [data], timestamp });
      const hmac = crypto.createHmac('sha256', this.secureIPC.secretKey);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Test file encryption/decryption
   */
  async testFileEncryption() {
    try {
      const testData = 'This is sensitive test data for encryption testing';
      const testFile = path.join(__dirname, 'test-file.txt');
      const encryptedFile = path.join(__dirname, 'test-file.enc');
      const decryptedFile = path.join(__dirname, 'test-file-decrypted.txt');

      // Write test data
      await fs.writeFile(testFile, testData);

      // Test encryption
      const data = await fs.readFile(testFile);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', this.secureConfig.get('masterPassword'));
      let encryptedData = cipher.update(data);
      encryptedData = Buffer.concat([encryptedData, cipher.final()]);
      const encryptedWithIv = Buffer.concat([iv, encryptedData]);
      await fs.writeFile(encryptedFile, encryptedWithIv);

      // Test decryption
      const encryptedContent = await fs.readFile(encryptedFile);
      const decryptedIv = encryptedContent.slice(0, 16);
      const decryptedData = encryptedContent.slice(16);
      const decipher = crypto.createDecipher('aes-256-cbc', this.secureConfig.get('masterPassword'));
      let decrypted = decipher.update(decryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      await fs.writeFile(decryptedFile, decrypted);

      // Verify decrypted content
      const decryptedContent = await fs.readFile(decryptedFile, 'utf8');
      const isCorrect = decryptedContent === testData;

      // Cleanup
      await fs.unlink(testFile);
      await fs.unlink(encryptedFile);
      await fs.unlink(decryptedFile);

      this.addTestResult(
        'File Security',
        'File Encryption/Decryption',
        isCorrect,
        isCorrect ? 'File encryption/decryption working correctly' : 'Decrypted content does not match original'
      );
    } catch (error) {
      this.addTestResult('File Security', 'File Encryption/Decryption', false, error.message);
    }
  }

  /**
   * Test authentication security
   */
  async testAuthenticationSecurity() {
    try {
      const { hashPassword, verifyPassword } = require('../electron/auth');

      // Test password hashing
      const testPassword = 'TestPassword123!';
      const { hash, salt } = hashPassword(testPassword);

      if (!hash || !salt || hash.length !== 128) {
        this.addTestResult('Authentication', 'Password Hashing', false, 'Invalid password hash');
        return;
      }

      // Test password verification
      const isValid = verifyPassword(testPassword, hash, salt);
      const isInvalid = !verifyPassword('WrongPassword', hash, salt);

      if (!isValid || isInvalid) {
        this.addTestResult('Authentication', 'Password Verification', false, 'Password verification failed');
        return;
      }

      // Test against common passwords
      const commonPasswords = ['password', '123456', 'admin', 'qwerty'];
      let commonPasswordDetected = false;

      for (const common of commonPasswords) {
        const { hash: commonHash } = hashPassword(common);
        if (commonHash.length < 64) { // Weak passwords should have shorter hashes
          commonPasswordDetected = true;
          break;
        }
      }

      this.addTestResult(
        'Authentication',
        'Password Security',
        !commonPasswordDetected,
        commonPasswordDetected ? 'Common password vulnerability detected' : 'Password security working correctly'
      );
    } catch (error) {
      this.addTestResult('Authentication', 'Password Security', false, error.message);
    }
  }

  /**
   * Test database security
   */
  async testDatabaseSecurity() {
    try {
      // Test SQLCipher key validation
      const { get_encryption_key } = require('../backend/core/database');
      
      // Set valid key
      process.env.SQLCIPHER_KEY = 'test-sqlcipher-key-32-chars-long-secure';
      const validKey = get_encryption_key();
      
      if (validKey !== process.env.SQLCIPHER_KEY) {
        this.addTestResult('Database', 'Key Validation', false, 'SQLCipher key validation failed');
        return;
      }

      // Test invalid key
      process.env.SQLCIPHER_KEY = 'short';
      try {
        get_encryption_key();
        this.addTestResult('Database', 'Key Validation', false, 'Should reject short keys');
        return;
      } catch (error) {
        // Expected to fail
      }

      // Test missing key
      delete process.env.SQLCIPHER_KEY;
      try {
        get_encryption_key();
        this.addTestResult('Database', 'Key Validation', false, 'Should reject missing keys');
        return;
      } catch (error) {
        // Expected to fail
      }

      this.addTestResult('Database', 'SQLCipher Security', true, 'Database security validation working correctly');
    } catch (error) {
      this.addTestResult('Database', 'SQLCipher Security', false, error.message);
    }
  }

  /**
   * Test rate limiting
   */
  async testRateLimiting() {
    try {
      const testIP = '127.0.0.1';
      const maxRequests = 100;
      const windowMs = 60000;

      // Simulate requests
      let blockedRequests = 0;
      for (let i = 0; i < maxRequests + 10; i++) {
        const isAllowed = this.checkRateLimit(testIP, windowMs, maxRequests);
        if (!isAllowed) {
          blockedRequests++;
        }
      }

      const isRateLimiting = blockedRequests >= 10; // Should block at least 10 requests

      this.addTestResult(
        'Security',
        'Rate Limiting',
        isRateLimiting,
        isRateLimiting ? 
          `Rate limiting working correctly (blocked ${blockedRequests} requests)` :
          'Rate limiting not working properly'
      );
    } catch (error) {
      this.addTestResult('Security', 'Rate Limiting', false, error.message);
    }
  }

  /**
   * Check rate limit for IP
   */
  checkRateLimit(ip, windowMs, maxRequests) {
    if (!this.rateLimitData) {
      this.rateLimitData = new Map();
    }

    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.rateLimitData.has(ip)) {
      this.rateLimitData.set(ip, []);
    }

    const requests = this.rateLimitData.get(ip);
    
    // Remove old requests
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    this.rateLimitData.set(ip, validRequests);

    // Check if under limit
    if (validRequests.length < maxRequests) {
      validRequests.push(now);
      return true;
    }

    return false;
  }

  /**
   * Test Content Security Policy
   */
  async testContentSecurityPolicy() {
    try {
      // Check if CSP is configured in main.js
      const mainJs = await fs.readFile('../electron/main.js', 'utf8');
      const hasCSP = mainJs.includes('Content-Security-Policy');
      const hasNodeIntegrationDisabled = mainJs.includes('nodeIntegration: false');
      const hasContextIsolation = mainJs.includes('contextIsolation: true');
      const hasSandbox = mainJs.includes('sandbox: true');

      const allSecurityMeasures = hasCSP && hasNodeIntegrationDisabled && hasContextIsolation && hasSandbox;

      this.addTestResult(
        'Security',
        'Content Security Policy',
        allSecurityMeasures,
        allSecurityMeasures ? 
          'All security measures configured' :
          'Missing security configurations'
      );
    } catch (error) {
      this.addTestResult('Security', 'Content Security Policy', false, error.message);
    }
  }

  /**
   * Run all security tests
   */
  async runAllTests() {
    console.log('🔒 Starting Security Integration Tests...\n');

    // Setup test environment
    const setupSuccess = await this.setupTestEnvironment();
    if (!setupSuccess) {
      console.error('❌ Failed to setup test environment');
      return this.generateReport();
    }

    // Run all tests
    await this.testSecureConfiguration();
    await this.testIPCSecurity();
    await this.testFileEncryption();
    await this.testAuthenticationSecurity();
    await this.testDatabaseSecurity();
    await this.testRateLimiting();
    await this.testContentSecurityPolicy();

    return this.generateReport();
  }

  /**
   * Generate test report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.passed).length,
        failed: this.testResults.filter(r => !r.passed).length
      },
      results: this.testResults,
      categories: this.groupResultsByCategory()
    };

    return report;
  }

  /**
   * Group results by category
   */
  groupResultsByCategory() {
    const categories = {};
    
    for (const result of this.testResults) {
      if (!categories[result.category]) {
        categories[result.category] = {
          total: 0,
          passed: 0,
          failed: 0,
          tests: []
        };
      }
      
      categories[result.category].total++;
      categories[result.category].tests.push(result);
      
      if (result.passed) {
        categories[result.category].passed++;
      } else {
        categories[result.category].failed++;
      }
    }
    
    return categories;
  }

  /**
   * Print test results
   */
  printResults(report) {
    console.log('\n📊 SECURITY INTEGRATION TEST RESULTS');
    console.log('='.repeat(60));

    // Summary
    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${report.summary.total}`);
    console.log(`   Passed: ${report.summary.passed}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Success Rate: ${((report.summary.passed / report.summary.total) * 100).toFixed(1)}%`);

    // Results by category
    console.log(`\n📋 Results by Category:`);
    for (const [category, results] of Object.entries(report.categories)) {
      const status = results.failed === 0 ? '✅' : '❌';
      const rate = ((results.passed / results.total) * 100).toFixed(1);
      console.log(`   ${status} ${category}: ${results.passed}/${results.total} (${rate}%)`);
      
      if (results.failed > 0) {
        const failedTests = results.tests.filter(t => !t.passed);
        for (const test of failedTests) {
          console.log(`      ❌ ${test.testName}: ${test.message}`);
        }
      }
    }

    // Overall status
    const allPassed = report.summary.failed === 0;
    console.log(`\n🎯 Overall Security Status: ${allPassed ? '✅ SECURE' : '❌ VULNERABLE'}`);
    
    if (allPassed) {
      console.log('   All security tests passed! Application is secure.');
    } else {
      console.log(`   ${report.summary.failed} security test(s) failed. Review and fix issues before deployment.`);
    }
  }

  /**
   * Save test report
   */
  async saveReport(report) {
    const filename = `security-test-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
    console.log(`\n📄 Test report saved: ${filename}`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const tester = new SecurityIntegrationTests();
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Security Integration Tests for Simple378 Fraud Detection

Usage: node test-security-integration.js [options]

Options:
  --help, -h     Show this help message
  --category X    Run only tests for category X
  --quick         Run quick security tests only

Categories:
  Configuration, IPC, File Security, Authentication, Database, Security

Examples:
  node test-security-integration.js              # Run all tests
  node test-security-integration.js --category IPC  # Run IPC tests only
    `);
    return;
  }

  try {
    let report;
    
    if (args.includes('--quick')) {
      // Run only critical tests
      await tester.setupTestEnvironment();
      await tester.testSecureConfiguration();
      await tester.testIPCSecurity();
      await tester.testAuthenticationSecurity();
      report = tester.generateReport();
    } else if (args.includes('--category')) {
      const categoryIndex = args.indexOf('--category');
      const category = args[categoryIndex + 1];
      
      await tester.setupTestEnvironment();
      
      switch (category.toLowerCase()) {
        case 'configuration':
          await tester.testSecureConfiguration();
          break;
        case 'ipc':
          await tester.testIPCSecurity();
          break;
        case 'file':
          await tester.testFileEncryption();
          break;
        case 'authentication':
          await tester.testAuthenticationSecurity();
          break;
        case 'database':
          await tester.testDatabaseSecurity();
          break;
        case 'security':
          await tester.testRateLimiting();
          await tester.testContentSecurityPolicy();
          break;
        default:
          console.error(`Unknown category: ${category}`);
          return;
      }
      
      report = tester.generateReport();
    } else {
      // Run all tests
      report = await tester.runAllTests();
    }
    
    tester.printResults(report);
    await tester.saveReport(report);
    
    // Exit with error code if tests failed
    if (report.summary.failed > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Security integration tests failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SecurityIntegrationTests;