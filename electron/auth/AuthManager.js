/**
 * Authentication Manager for Simple378 Electron App
 * 
 * Handles user authentication and password-based encryption key derivation.
 * Connects to the existing Key Management system for secure storage.
 */

const { app } = require('electron');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

class AuthManager {
    constructor(keyManager) {
        this.keyManager = keyManager;
        this.authenticated = false;
        this.currentUser = null;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.sessionTimer = null;
        
        this.authDataPath = path.join(app.getPath('userData'), 'auth.json');
    }

    /**
     * Initialize authentication system
     */
    async initialize() {
        try {
            // Load auth data if exists
            await this.loadAuthData();
            console.log('[AuthManager] Initialized');
        } catch (error) {
            console.error('[AuthManager] Initialization error:', error);
        }
    }

    /**
     * Register new user with password
     * @param {string} username
     * @param {string} password
     * @param {string} email
     */
    async register(username, password, email) {
        // Validate password strength
        if (!this.validatePassword(password)) {
            throw new Error('Password does not meet security requirements');
        }

        // Generate salt for password hashing
        const salt = crypto.randomBytes(32).toString('hex');

        // Hash password using Argon2 via Node crypto (simplified for demo)
        // In production, use actual argon2 npm package
        const passwordHash = await this.hashPassword(password, salt);

        // Derive encryption key from password
        const encryptionKey = await this.deriveEncryptionKey(password, salt);

        // Store encryption key in OS keychain via KeyManager
        await this.keyManager.storeEncryptionKey('database', encryptionKey);

        // Store user data (not the actual password!)
        const authData = {
            username,
            email,
            passwordHash,
            salt,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        await this.saveAuthData(authData);

        console.log('[AuthManager] User registered successfully');
        return { username, email };
    }

    /**
     * Authenticate user with password
     * @param {string} username
     * @param {string} password
     */
    async login(username, password) {
        const authData = await this.loadAuthData();

        if (!authData || authData.username !== username) {
            throw new Error('Invalid credentials');
        }

        // Verify password
        const passwordHash = await this.hashPassword(password, authData.salt);
        
        if (passwordHash !== authData.passwordHash) {
            throw new Error('Invalid credentials');
        }

        // Derive encryption key from password
        const encryptionKey = await this.deriveEncryptionKey(password, authData.salt);

        // Store encryption key for this session
        await this.keyManager.storeEncryptionKey('database', encryptionKey);

        // Set environment variable for backend
        process.env.SQLCIPHER_KEY = encryptionKey;

        // Update last login
        authData.lastLogin = new Date().toISOString();
        await this.saveAuthData(authData);

        // Set authenticated state
        this.authenticated = true;
        this.currentUser = {
            username: authData.username,
            email: authData.email
        };

        // Start session timeout
        this.resetSessionTimeout();

        console.log('[AuthManager] User logged in successfully');
        return this.currentUser;
    }

    /**
     * Logout user
     */
    async logout() {
        // Clear encryption key from keychain
        await this.keyManager.clearEncryptionKey('database');

        // Clear session
        this.authenticated = false;
        this.currentUser = null;

        // Clear session timeout
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }

        // Clear environment variable
        delete process.env.SQLCIPHER_KEY;

        console.log('[AuthManager] User logged out');
    }

    /**
     * Change user password
     * @param {string} currentPassword
     * @param {string} newPassword
     */
    async changePassword(currentPassword, newPassword) {
        if (!this.authenticated) {
            throw new Error('Not authenticated');
        }

        const authData = await this.loadAuthData();

        // Verify current password
        const currentHash = await this.hashPassword(currentPassword, authData.salt);
        if (currentHash !== authData.passwordHash) {
            throw new Error('Current password is incorrect');
        }

        // Validate new password
        if (!this.validatePassword(newPassword)) {
            throw new Error('New password does not meet security requirements');
        }

        // Generate new salt
        const newSalt = crypto.randomBytes(32).toString('hex');

        // Hash new password
        const newPasswordHash = await this.hashPassword(newPassword, newSalt);

        // Derive new encryption key
        const newEncryptionKey = await this.deriveEncryptionKey(newPassword, newSalt);

        // Re-encrypt database with new key (this requires SQLCipher PRAGMA rekey)
        // For now, we'll just update the stored key
        await this.keyManager.storeEncryptionKey('database', newEncryptionKey);

        // Update auth data
        authData.passwordHash = newPasswordHash;
        authData.salt = newSalt;
        authData.passwordChangedAt = new Date().toISOString();

        await this.saveAuthData(authData);

        console.log('[AuthManager] Password changed successfully');
        return true;
    }

    /**
     * Hash password using PBKDF2 (Argon2 alternative for Node.js built-in)
     * @param {string} password
     * @param {string} salt
     */
    async hashPassword(password, salt) {
        return new Promise((resolve, reject) => {
            // Using PBKDF2 with 600,000 iterations (OWASP recommendation)
            crypto.pbkdf2(password, salt, 600000, 64, 'sha512', (err, derivedKey) => {
                if (err) reject(err);
                resolve(derivedKey.toString('hex'));
            });
        });
    }

    /**
     * Derive encryption key from password
     * @param {string} password
     * @param {string} salt
     */
    async deriveEncryptionKey(password, salt) {
        return new Promise((resolve, reject) => {
            // Derive 256-bit key for SQLCipher
            crypto.pbkdf2(password, salt, 256000, 32, 'sha256', (err, derivedKey) => {
                if (err) reject(err);
                resolve(derivedKey.toString('hex'));
            });
        });
    }

    /**
     * Validate password strength
     * @param {string} password
     */
    validatePassword(password) {
        // Minimum 12 characters
        if (password.length < 12) {
            return false;
        }

        // Must contain uppercase, lowercase, number, and special character
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        return hasUppercase && hasLowercase && hasNumber && hasSpecial;
    }

    /**
     * Reset session timeout
     */
    resetSessionTimeout() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }

        this.sessionTimer = setTimeout(async () => {
            console.log('[AuthManager] Session timeout - logging out');
            await this.logout();
            // Emit event to UI to show login screen
            // mainWindow.webContents.send('session-expired');
        }, this.sessionTimeout);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.authenticated;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Load auth data from disk
     */
    async loadAuthData() {
        try {
            const data = await fs.readFile(this.authDataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null; // No auth data yet
            }
            throw error;
        }
    }

    /**
     * Save auth data to disk
     */
    async saveAuthData(authData) {
        await fs.writeFile(
            this.authDataPath,
            JSON.stringify(authData, null, 2),
            'utf8'
        );
    }

    /**
     * Check if user is registered
     */
    async isUserRegistered() {
        const authData = await this.loadAuthData();
        return authData !== null;
    }
}

module.exports = AuthManager;
