import { v4 as uuidv4 } from 'uuid';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  sanitized?: boolean;
}

export class SecureLogger {
  private static instance: SecureLogger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }

  private generateSessionId(): string {
    return uuidv4();
  }

  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      // Remove potential PII patterns
      return data
        .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN REDACTED]') // SSN
        .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[CARD REDACTED]') // Credit card
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL REDACTED]') // Email
        .replace(/\b\d{10}\b/g, '[PHONE REDACTED]'); // Phone
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      // Remove sensitive fields
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'credit_card'];
      sensitiveFields.forEach(field => {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      });
      return sanitized;
    }

    return data;
  }

  private createLogEntry(
    level: LogEntry['level'],
    category: string,
    message: string,
    metadata?: Record<string, any>
  ): LogEntry {
    const userId = this.getCurrentUserId();

    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message: this.sanitizeData(message),
      userId,
      sessionId: this.sessionId,
      metadata: metadata ? this.sanitizeData(metadata) : undefined,
      sanitized: true
    };
  }

  private getCurrentUserId(): string | undefined {
    try {
      // Get from localStorage or context
      const authData = localStorage.getItem('auth_data');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.userId || parsed.id;
      }
    } catch {
      // Ignore parsing errors
    }
    return undefined;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest
    }

    // In production, send to secure logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToSecureService(entry);
    } else {
      // In development, still use console but sanitized
      this.outputToConsole(entry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${entry.category}]`;
    const sanitizedMessage = entry.sanitized ? entry.message : '[UNSANI TIZED] ' + entry.message;

    switch (entry.level) {
      case 'debug':
        console.debug(`${prefix} ${sanitizedMessage}`, entry.metadata || '');
        break;
      case 'info':
        console.info(`${prefix} ${sanitizedMessage}`, entry.metadata || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${sanitizedMessage}`, entry.metadata || '');
        break;
      case 'error':
        console.error(`${prefix} ${sanitizedMessage}`, entry.metadata || '');
        break;
    }
  }

  private async sendToSecureService(entry: LogEntry): Promise<void> {
    try {
      // Send to secure logging endpoint
      await fetch('/api/v1/logs/secure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      // Fallback to local storage if remote logging fails
      console.error('[SecureLogger] Failed to send log to remote service:', error);
      this.storeLocally(entry);
    }
  }

  private storeLocally(entry: LogEntry): void {
    try {
      const logs = JSON.parse(localStorage.getItem('secure_logs') || '[]');
      logs.push(entry);
      if (logs.length > 100) {
        logs.shift(); // Keep only last 100 logs locally
      }
      localStorage.setItem('secure_logs', JSON.stringify(logs));
    } catch {
      // Ignore storage errors
    }
  }

  // Public logging methods
  debug(category: string, message: string, metadata?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      const entry = this.createLogEntry('debug', category, message, metadata);
      this.addLog(entry);
    }
  }

  info(category: string, message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry('info', category, message, metadata);
    this.addLog(entry);
  }

  warn(category: string, message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry('warn', category, message, metadata);
    this.addLog(entry);
  }

  error(category: string, message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry('error', category, message, metadata);
    this.addLog(entry);
  }

  // Security-specific logging
  securityEvent(eventType: string, userId: string, details: Record<string, any>): void {
    this.error('SECURITY', `Security event: ${eventType}`, {
      ...details,
      eventType,
      userId: this.sanitizeData(userId),
      timestamp: new Date().toISOString()
    });
  }

  auditLog(action: string, resource: string, userId: string, changes?: Record<string, any>): void {
    this.info('AUDIT', `User action: ${action} on ${resource}`, {
      action,
      resource,
      userId: this.sanitizeData(userId),
      changes: changes ? this.sanitizeData(changes) : undefined,
      ipAddress: this.getClientIP()
    });
  }

  private getClientIP(): string {
    // This would typically come from the server
    // For client-side, we can't reliably get the real IP
    return 'client-side';
  }

  // Get logs for debugging (only in development)
  getLogs(level?: LogEntry['level']): LogEntry[] {
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }

    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }
}

// Export singleton instance
export const secureLogger = SecureLogger.getInstance();

// Legacy console replacement for critical error handling only
export const secureConsole = {
  error: (message: string, ...args: any[]) => {
    secureLogger.error('CONSOLE', message, { args });
  },
  warn: (message: string, ...args: any[]) => {
    secureLogger.warn('CONSOLE', message, { args });
  }
};