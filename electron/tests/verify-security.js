// Setup mocks first
require('./mock-electron');

const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const assert = require('assert');

// Import modules to test
const SecureIPC = require('../secure-ipc');
const DatabaseEncryption = require('../database-encryption');
const KeyManager = require('../key-management');
const SecureFileStorage = require('../secure-file-storage');

const TEST_DIR = path.join(os.tmpdir(), '378x492-tests');

async function runTests() {
  console.log('🔒 Starting Security Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  try {
    // Ensure test directory exists
    await fs.mkdir(TEST_DIR, { recursive: true });

    // --- TEST 1: Secure IPC ---
    console.log('Test 1: Secure IPC');
    try {
      const secret = '12345678901234567890123456789012'; // 32 chars for AES-256
      const secureIPC = new SecureIPC(secret);
      
      // Test signing
      const data = { operation: 'test', payload: 'foo' };
      const signed = secureIPC.signRequest(data);
      assert.ok(signed.signature, 'Signature should exist');
      assert.ok(signed.timestamp, 'Timestamp should exist');
      
      // Test verification
      const verified = secureIPC.verifyRequest(signed);
      assert.strictEqual(verified.operation, data.operation);
      assert.strictEqual(verified.payload, data.payload);
      assert.ok(verified.timestamp, 'Timestamp should be present in verified data');
      
      // Test encryption
      const encrypted = secureIPC.encryptRequest(data);
      assert.ok(encrypted.encrypted, 'Encrypted data should exist');
      assert.notEqual(encrypted.encrypted, JSON.stringify(data), 'Encrypted data should differ from plaintext');
      
      // Test decryption
      const decrypted = secureIPC.decryptRequest(encrypted);
      assert.deepStrictEqual(decrypted, data, 'Decrypted data should match original');
      
      console.log('✅ Secure IPC Verified');
      passed++;
    } catch (e) {
      console.error('❌ Secure IPC Failed:', e);
      failed++;
    }

    // --- TEST 2: Key Management ---
    console.log('\nTest 2: Key Management');
    try {
      const keyStorePath = path.join(TEST_DIR, 'keys');
      const keyManager = new KeyManager(keyStorePath);
      
      // Generate Master Key
      const password = 'test-password';
      const keyId = await keyManager.storeMasterKey(keyManager.generateMasterKey(), password);
      assert.ok(keyId, 'Key ID should be returned');
      
      // Retrieve Key
      const retrieved = await keyManager.retrieveMasterKey(password);
      assert.strictEqual(retrieved.keyId, 'master-key', 'Retrieved key ID should match');
      assert.ok(retrieved.key, 'Key buffer should be returned');
      
      console.log('✅ Key Management Verified');
      passed++;
    
      // Keep key for next tests
      var MASTER_KEY = retrieved.key;
    } catch (e) {
       console.error('❌ Key Management Failed:', e);
       failed++;
    }

    // --- TEST 3: Secure File Storage ---
    console.log('\nTest 3: Secure File Storage');
    try {
        if (!MASTER_KEY) throw new Error('Skipping: No Master Key');

        const storagePath = path.join(TEST_DIR, 'secure-storage');
        const fileStorage = new SecureFileStorage(MASTER_KEY, storagePath);
        
        // Create dummy file
        const testFile = path.join(TEST_DIR, 'secret.txt');
        await fs.writeFile(testFile, 'This is a super secret message.');
        
        // Store
        const fileId = await fileStorage.storeFile(testFile, { type: 'test' });
        assert.ok(fileId, 'File ID should be generated');
        
        // Verify encrypted file exists
        const encPath = path.join(storagePath, 'encrypted', `${fileId}.enc`);
        await fs.access(encPath);
        
        // Retrieve
        const retrieved = await fileStorage.retrieveFile(fileId);
        const content = retrieved.buffer.toString();
        assert.strictEqual(content, 'This is a super secret message.', 'Retrieved content should match');
        
        console.log('✅ Secure File Storage Verified');
        passed++;
    } catch (e) {
        console.error('❌ Secure File Storage Failed:', e);
        failed++;
    }

    // --- TEST 4: Database Encryption ---
    console.log('\nTest 4: Database Encryption');
    try {
       // Note: We cannot fully test SQLCipher without the native module built with extension
       // We will test the Key generation and Logic
       const dbEncryption = new DatabaseEncryption('test-password');
       
       const key = dbEncryption.getSQLCipherKey();
       assert.ok(key.startsWith("x'"), 'Key should be in SQLCipher hex format');
       
       // Verification of logic
       const info = dbEncryption.getEncryptionInfo();
       assert.strictEqual(info.algorithm, 'AES-256');
       
       console.log('✅ Database Encryption (Logic) Verified');
       passed++;
    } catch (e) {
        console.error('❌ Database Encryption Failed:', e);
        failed++;
    }

  } catch (err) {
      console.error('Fatal Test Error:', err);
      failed++;
  } finally {
      console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
      // Cleanup
      // await fs.rm(TEST_DIR, { recursive: true, force: true });
  }
  
  return failed === 0;
}

if (require.main === module) {
    runTests().then(success => process.exit(success ? 0 : 1));
}

module.exports = runTests;
