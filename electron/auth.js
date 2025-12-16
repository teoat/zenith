const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');

// In-memory cache for authentication state
let authState = {
  isAuthenticated: false,
  userId: null,
  lastAuthTime: null,
  biometricEnabled: false
};

// Master password hash storage
const AUTH_FILE = path.join(app.getPath('userData'), 'auth.dat');

/**
 * Hash password with PBKDF2
 */
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(32).toString('hex');
  }

  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
  return { hash: hash.toString('hex'), salt };
}

/**
 * Verify password against stored hash
 */
function verifyPassword(password, storedHash, salt) {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(storedHash, 'hex')
  );
}

/**
 * Load authentication data
 */
async function loadAuthData() {
  try {
    const encryptedData = await fs.readFile(AUTH_FILE, 'utf8');
    
    // Get encryption key from environment or secure config
    const authKey = process.env.AUTH_ENCRYPTION_KEY;
    if (!authKey) {
      throw new Error('AUTH_ENCRYPTION_KEY environment variable is required');
    }
    
    const decipher = crypto.createDecipher('aes-256-cbc', authKey);
    let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');
    
    return JSON.parse(decryptedData);
  } catch (error) {
    // File doesn't exist or is corrupted
    return null;
  }
}

/**
 * Save authentication data
 */
async function saveAuthData(data) {
  // Get encryption key from environment or secure config
  const authKey = process.env.AUTH_ENCRYPTION_KEY;
  if (!authKey) {
    throw new Error('AUTH_ENCRYPTION_KEY environment variable is required');
  }
  
  const encrypted = crypto.createCipher('aes-256-cbc', authKey);
  let encryptedData = encrypted.update(JSON.stringify(data), 'utf8', 'hex');
  encryptedData += encrypted.final('hex');

  await fs.writeFile(AUTH_FILE, encryptedData);
}

/**
 * Set master password (first-time setup)
 */
async function setMasterPassword(password) {
  const { hash, salt } = hashPassword(password);

  const authData = {
    masterHash: hash,
    salt: salt,
    created: Date.now(),
    biometricEnabled: false
  };

  await saveAuthData(authData);
  authState.isAuthenticated = true;
  authState.lastAuthTime = Date.now();

  return { success: true };
}

/**
 * Authenticate with master password
 */
async function authenticate(password) {
  const authData = await loadAuthData();

  if (!authData) {
    throw new Error('No master password set. Please set up authentication first.');
  }

  const isValid = verifyPassword(password, authData.masterHash, authData.salt);

  if (isValid) {
    authState.isAuthenticated = true;
    authState.lastAuthTime = Date.now();
    return { success: true };
  } else {
    // Rate limiting could be added here
    throw new Error('Invalid password');
  }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return authState.isAuthenticated;
}

/**
 * Logout
 */
function logout() {
  authState.isAuthenticated = false;
  authState.userId = null;
  authState.lastAuthTime = null;
}

/**
 * Change master password
 */
async function changeMasterPassword(currentPassword, newPassword) {
  // First verify current password
  await authenticate(currentPassword);

  // Set new password
  await setMasterPassword(newPassword);

  return { success: true };
}

/**
 * Enable biometric authentication
 */
async function enableBiometric() {
  // Check if biometric is available
  // This would integrate with system APIs (TouchID, Windows Hello, etc.)
  // For now, just mark as enabled
  authState.biometricEnabled = true;

  const authData = await loadAuthData();
  if (authData) {
    authData.biometricEnabled = true;
    await saveAuthData(authData);
  }

  return { success: true };
}

/**
 * Authenticate with biometrics
 */
async function authenticateBiometric() {
  if (!authState.biometricEnabled) {
    throw new Error('Biometric authentication not enabled');
  }

  // This would trigger system biometric prompt
  // For simulation, we'll assume success
  authState.isAuthenticated = true;
  authState.lastAuthTime = Date.now();

  return { success: true };
}

/**
 * Get authentication status
 */
function getAuthStatus() {
  return {
    isAuthenticated: authState.isAuthenticated,
    lastAuthTime: authState.lastAuthTime,
    biometricEnabled: authState.biometricEnabled,
    requiresAuth: !authState.isAuthenticated
  };
}

/**
 * Check if master password is set
 */
async function isMasterPasswordSet() {
  const authData = await loadAuthData();
  return authData !== null;
}

module.exports = {
  setMasterPassword,
  authenticate,
  isAuthenticated,
  logout,
  changeMasterPassword,
  enableBiometric,
  authenticateBiometric,
  getAuthStatus,
  isMasterPasswordSet
};