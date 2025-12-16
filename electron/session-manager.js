/**
 * Enhanced Session Manager
 * Provides secure session management with timeout, rotation, and monitoring
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class SessionManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      sessionTimeoutMinutes: options.sessionTimeoutMinutes || 60,
      maxConcurrentSessions: options.maxConcurrentSessions || 3,
      sessionRenewalMinutes: options.sessionRenewalMinutes || 30,
      lockoutDurationMinutes: options.lockoutDurationMinutes || 15,
      maxLoginAttempts: options.maxLoginAttempts || 5,
      ...options
    };
    
    this.sessions = new Map(); // sessionId -> session data
    this.failedAttempts = new Map(); // IP -> failed attempts
    this.lockedIPs = new Map(); // IP -> lockout expiry
    this.sessionStats = {
      totalSessions: 0,
      activeSessions: 0,
      expiredSessions: 0,
      revokedSessions: 0
    };
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
      this.cleanupLockedIPs();
    }, 60000); // Every minute
    
    console.log('🔐 Session Manager initialized with secure session management');
  }

  /**
   * Generate secure session ID
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create new session
   */
  async createSession(userId, userInfo = {}, ipAddress = 'unknown') {
    try {
      // Check if IP is locked
      if (this.isIPLocked(ipAddress)) {
        throw new Error('IP address is temporarily locked due to failed attempts');
      }

      // Check concurrent session limit
      const userSessions = this.getUserSessions(userId);
      if (userSessions.length >= this.options.maxConcurrentSessions) {
        // Revoke oldest session
        const oldestSession = userSessions[0];
        await this.revokeSession(oldestSession.sessionId, 'Session limit exceeded');
      }

      const sessionId = this.generateSessionId();
      const now = Date.now();
      
      const session = {
        sessionId,
        userId,
        userInfo,
        ipAddress,
        createdAt: now,
        lastActivity: now,
        expiresAt: now + (this.options.sessionTimeoutMinutes * 60 * 1000),
        renewalAt: now + (this.options.sessionRenewalMinutes * 60 * 1000),
        isActive: true,
        permissions: userInfo.permissions || [],
        activityLog: [{ timestamp: now, action: 'session_created' }]
      };

      this.sessions.set(sessionId, session);
      this.sessionStats.totalSessions++;
      this.sessionStats.activeSessions++;

      // Clear failed attempts for this IP on successful login
      this.failedAttempts.delete(ipAddress);

      this.emit('sessionCreated', { sessionId, userId, ipAddress });

      console.log(`✅ Session created: ${sessionId} for user ${userId}`);
      
      return {
        sessionId,
        expiresAt: session.expiresAt,
        renewalAt: session.renewalAt
      };
      
    } catch (error) {
      console.error('❌ Session creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate session
   */
  async validateSession(sessionId, ipAddress = 'unknown') {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return { valid: false, reason: 'Session not found' };
      }

      if (!session.isActive) {
        return { valid: false, reason: 'Session is inactive' };
      }

      // Check if IP is locked
      if (this.isIPLocked(ipAddress)) {
        return { valid: false, reason: 'IP address is locked' };
      }

      // Check session expiration
      const now = Date.now();
      if (now > session.expiresAt) {
        this.revokeSession(sessionId, 'Session expired');
        return { valid: false, reason: 'Session expired' };
      }

      // Check if renewal is needed
      if (now > session.renewalAt) {
        await this.renewSession(sessionId);
      }

      // Update last activity
      session.lastActivity = now;
      session.activityLog.push({ timestamp: now, action: 'session_validated' });

      return { 
        valid: true, 
        session: {
          userId: session.userId,
          userInfo: session.userInfo,
          permissions: session.permissions,
          expiresAt: session.expiresAt
        }
      };
      
    } catch (error) {
      console.error('❌ Session validation failed:', error.message);
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Renew session
   */
  async renewSession(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || !session.isActive) {
        return false;
      }

      const now = Date.now();
      session.expiresAt = now + (this.options.sessionTimeoutMinutes * 60 * 1000);
      session.renewalAt = now + (this.options.sessionRenewalMinutes * 60 * 1000);
      session.activityLog.push({ timestamp: now, action: 'session_renewed' });

      this.emit('sessionRenewed', { sessionId, userId: session.userId });

      console.log(`🔄 Session renewed: ${sessionId}`);
      return true;
      
    } catch (error) {
      console.error('❌ Session renewal failed:', error.message);
      return false;
    }
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionId, reason = 'Manual revocation') {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return false;
      }

      session.isActive = false;
      session.revokedAt = Date.now();
      session.revocationReason = reason;
      session.activityLog.push({ 
        timestamp: session.revokedAt, 
        action: 'session_revoked',
        details: reason 
      });

      this.sessionStats.activeSessions--;
      this.sessionStats.revokedSessions++;

      // Remove from active sessions after a delay
      setTimeout(() => {
        this.sessions.delete(sessionId);
      }, 5000); // Keep for 5 seconds for logging

      this.emit('sessionRevoked', { sessionId, userId: session.userId, reason });

      console.log(`🚫 Session revoked: ${sessionId} (${reason})`);
      return true;
      
    } catch (error) {
      console.error('❌ Session revocation failed:', error.message);
      return false;
    }
  }

  /**
   * Record failed login attempt
   */
  recordFailedAttempt(ipAddress, userId = 'unknown') {
    const now = Date.now();
    const attempts = this.failedAttempts.get(ipAddress) || [];
    
    attempts.push({
      timestamp: now,
      userId,
      ipAddress
    });

    // Keep only recent attempts (within lockout window)
    const lockoutWindowMs = this.options.lockoutDurationMinutes * 60 * 1000;
    const recentAttempts = attempts.filter(attempt => 
      now - attempt.timestamp < lockoutWindowMs
    );
    
    this.failedAttempts.set(ipAddress, recentAttempts);

    // Check if IP should be locked
    if (recentAttempts.length >= this.options.maxLoginAttempts) {
      const lockoutExpiry = now + lockoutWindowMs;
      this.lockedIPs.set(ipAddress, lockoutExpiry);
      
      this.emit('IPLocked', { ipAddress, attempts: recentAttempts.length });
      
      console.log(`🔒 IP locked: ${ipAddress} (${recentAttempts.length} failed attempts)`);
    }

    return {
      attempts: recentAttempts.length,
      remaining: Math.max(0, this.options.maxLoginAttempts - recentAttempts.length),
      locked: this.isIPLocked(ipAddress)
    };
  }

  /**
   * Check if IP is locked
   */
  isIPLocked(ipAddress) {
    const lockoutExpiry = this.lockedIPs.get(ipAddress);
    if (!lockoutExpiry) {
      return false;
    }

    const now = Date.now();
    if (now > lockoutExpiry) {
      this.lockedIPs.delete(ipAddress);
      return false;
    }

    return true;
  }

  /**
   * Get user sessions
   */
  getUserSessions(userId) {
    const userSessions = [];
    
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.isActive) {
        userSessions.push(session);
      }
    }
    
    // Sort by creation time (oldest first)
    return userSessions.sort((a, b) => a.createdAt - b.createdAt);
  }

  /**
   * Get session info
   */
  getSessionInfo(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      sessionId: session.sessionId,
      userId: session.userId,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
      activityCount: session.activityLog.length,
      recentActivity: session.activityLog.slice(-10) // Last 10 activities
    };
  }

  /**
   * Get all active sessions
   */
  getActiveSessions() {
    const activeSessions = [];
    
    for (const session of this.sessions.values()) {
      if (session.isActive) {
        activeSessions.push(this.getSessionInfo(session.sessionId));
      }
    }
    
    return activeSessions;
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt || !session.isActive) {
        this.revokeSession(sessionId, 'Session expired during cleanup');
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.sessionStats.expiredSessions += cleanedCount;
      console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  /**
   * Cleanup locked IPs
   */
  cleanupLockedIPs() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [ipAddress, lockoutExpiry] of this.lockedIPs.entries()) {
      if (now > lockoutExpiry) {
        this.lockedIPs.delete(ipAddress);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired IP locks`);
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    return {
      ...this.sessionStats,
      concurrentSessions: this.sessions.size,
      lockedIPs: this.lockedIPs.size,
      failedAttemptIPs: this.failedAttempts.size,
      averageSessionDuration: this.calculateAverageSessionDuration(),
      topActiveUsers: this.getTopActiveUsers()
    };
  }

  /**
   * Calculate average session duration
   */
  calculateAverageSessionDuration() {
    const completedSessions = [];
    
    for (const session of this.sessions.values()) {
      if (session.revokedAt) {
        completedSessions.push(session.revokedAt - session.createdAt);
      }
    }
    
    if (completedSessions.length === 0) {
      return 0;
    }
    
    const totalDuration = completedSessions.reduce((sum, duration) => sum + duration, 0);
    return Math.round(totalDuration / completedSessions.length / 1000 / 60); // minutes
  }

  /**
   * Get top active users
   */
  getTopActiveUsers() {
    const userSessionCounts = new Map();
    
    for (const session of this.sessions.values()) {
      if (session.isActive) {
        const count = userSessionCounts.get(session.userId) || 0;
        userSessionCounts.set(session.userId, count + 1);
      }
    }
    
    return Array.from(userSessionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, activeSessions: count }));
  }

  /**
   * Revoke all user sessions
   */
  async revokeAllUserSessions(userId, reason = 'Admin action') {
    const userSessions = this.getUserSessions(userId);
    const revokedSessions = [];
    
    for (const session of userSessions) {
      const revoked = await this.revokeSession(session.sessionId, reason);
      if (revoked) {
        revokedSessions.push(session.sessionId);
      }
    }
    
    this.emit('allUserSessionsRevoked', { userId, revokedSessions, reason });
    
    return revokedSessions;
  }

  /**
   * Export session data for backup
   */
  exportSessionData() {
    const exportData = {
      timestamp: new Date().toISOString(),
      stats: this.getSessionStats(),
      activeSessions: this.getActiveSessions(),
      lockedIPs: Array.from(this.lockedIPs.entries()).map(([ip, expiry]) => ({
        ipAddress: ip,
        lockoutExpiry: new Date(expiry).toISOString()
      })),
      failedAttempts: Array.from(this.failedAttempts.entries()).map(([ip, attempts]) => ({
        ipAddress: ip,
        attempts: attempts.map(a => ({
          timestamp: new Date(a.timestamp).toISOString(),
          userId: a.userId
        }))
      }))
    };
    
    return exportData;
  }

  /**
   * Shutdown session manager
   */
  async shutdown() {
    console.log('🛑 Shutting down Session Manager...');
    
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Revoke all active sessions
    const activeSessions = this.getActiveSessions();
    for (const session of activeSessions) {
      await this.revokeSession(session.sessionId, 'System shutdown');
    }
    
    // Clear all data
    this.sessions.clear();
    this.failedAttempts.clear();
    this.lockedIPs.clear();
    
    console.log('✅ Session Manager shutdown complete');
  }
}

module.exports = SessionManager;