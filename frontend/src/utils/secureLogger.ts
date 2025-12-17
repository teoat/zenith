import { v4 as uuidv4 } from 'uuid';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
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

  private sanitizeData(data: unknown): unknown {
    if (typeof data === 'string') {
      // Remove potential PII patterns
      return data
        .replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, '[SSN REDACTED]') // SSN (Robust)
        .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[CARD REDACTED]') // Credit card
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL REDACTED]') // Email
        .replace(/\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, '[PHONE REDACTED]'); // Phone (Robust)
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...(data as Record<string, unknown>) };
      // Remove sensitive fields
      const sensitiveFields = [
        'password', 'token', 'secret', 'key', 'ssn', 'credit_card',
        'access_token', 'refresh_token', 'authorization', 'auth', 'jwt',
        'cvv', 'pin', 'otp', 'dob', 'birth_date'
      ];
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
    metadata?: Record<string, unknown>
  ): LogEntry {
    const userId = this.getCurrentUserId();

    // Use simple ID generation to avoid crypto issues in tests
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ?
      crypto.randomUUID() :
      `log_${Date.now()}_${Date.now().toString(36)}`; // Use timestamp for unique log ID

    return {
      id,
      timestamp: new Date().toISOString(),
      level,
      category,
      message: String(this.sanitizeData(message)),
      userId,
      sessionId: this.sessionId,
      metadata: metadata ? (this.sanitizeData(metadata) as Record<string, unknown>) : undefined,
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
      void this.sendToSecureService(entry);
    } else {
      // In development, still use console but sanitized
      this.outputToConsole(entry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${entry.category}]`;
    const sanitizedMessage = entry.sanitized ? entry.message : '[UNSANITIZED] ' + entry.message;

    switch (entry.level) {
      case 'debug': {
        const logger = console;
        logger.debug(`${prefix} ${sanitizedMessage}`, entry.metadata || '');
        break;
      }
      case 'info': {
        const loggerInfo = console;
        loggerInfo.info(`${prefix} ${sanitizedMessage}`, entry.metadata || '');
        break;
      }
      case 'warn': {
        const loggerWarn = console;
        loggerWarn.warn(`${prefix} ${sanitizedMessage}`, entry.metadata || '');
        break;
      }
      case 'error': {
        const loggerErr = console;
        loggerErr.error(`${prefix} ${sanitizedMessage}`, entry.metadata || '');
        break;
      }
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

  // Flexible logging methods to support various call signatures:
  // 1. (category: string, message: string, metadata?: object)
  // 2. (message: string, metadata?: object)
  // 3. (error: Error | unknown)
  debug(arg1: unknown, arg2?: unknown, arg3?: unknown): void {
    const { category, message, metadata } = this.parseArgs('debug', arg1, arg2, arg3);
    if (process.env.NODE_ENV === 'development') {
      const entry = this.createLogEntry('debug', category, message, metadata);
      this.addLog(entry);
    }
  }

  info(arg1: unknown, arg2?: unknown, arg3?: unknown): void {
    const { category, message, metadata } = this.parseArgs('info', arg1, arg2, arg3);
    const entry = this.createLogEntry('info', category, message, metadata);
    this.addLog(entry);
  }

  warn(arg1: unknown, arg2?: unknown, arg3?: unknown): void {
    const { category, message, metadata } = this.parseArgs('warn', arg1, arg2, arg3);
    const entry = this.createLogEntry('warn', category, message, metadata);
    this.addLog(entry);
  }

  error(arg1: unknown, arg2?: unknown, arg3?: unknown): void {
    const { category, message, metadata } = this.parseArgs('error', arg1, arg2, arg3);
    const entry = this.createLogEntry('error', category, message, metadata);
    this.addLog(entry);
  }

  private parseArgs(level: string, arg1: unknown, arg2?: unknown, arg3?: unknown): { category: string, message: string, metadata?: Record<string, unknown> } {
    let category = level.toUpperCase();
    let message = 'No message provided';
    let metadata: unknown = undefined;

    if (typeof arg1 === 'string') {
      if (typeof arg2 === 'string') {
        category = arg1;
        message = arg2;
        metadata = arg3;
      } else {
        message = arg1;
        metadata = arg2;
      }
    } else if (arg1 instanceof Error) {
      message = arg1.message;
      metadata = arg1;
    } else if (arg1 !== null && arg1 !== undefined) {
      message = 'Logged object';
      metadata = arg1;
    }

    // Standardize metadata into a Record
    let finalMetadata: Record<string, unknown> | undefined = undefined;
    if (metadata instanceof Error) {
      finalMetadata = { 
        error_name: metadata.name,
        error_message: metadata.message,
        error_stack: metadata.stack 
      };
    } else if (typeof metadata === 'object' && metadata !== null) {
      finalMetadata = metadata as Record<string, unknown>;
    } else if (metadata !== undefined) {
      finalMetadata = { value: String(metadata) };
    }

    return { 
      category, 
      message: String(message), 
      metadata: finalMetadata 
    };
  }

  // Security-specific logging
  securityEvent(eventType: string, userId: string, details: Record<string, unknown>): void {
    this.error('SECURITY', `Security event: ${eventType}`, {
      ...details,
      eventType,
      userId: String(this.sanitizeData(userId)),
      timestamp: new Date().toISOString()
    });
  }

  auditLog(action: string, resource: string, userId: string, changes?: Record<string, unknown>): void {
    this.info('AUDIT', `User action: ${action} on ${resource}`, {
      action,
      resource,
      userId: String(this.sanitizeData(userId)),
      changes: changes ? (this.sanitizeData(changes) as Record<string, unknown>) : undefined,
      ipAddress: this.getClientIP()
    });
  }

  private getClientIP(): string {
    return 'client-side';
  }

  getLogs(level?: LogEntry['level']): LogEntry[] {
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }

    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Export singleton instance
export const secureLogger = SecureLogger.getInstance();

// Legacy console replacement
export const secureConsole = {
  error: (message: string, ...args: unknown[]) => {
    secureLogger.error('CONSOLE', message, { args });
  },
  warn: (message: string, ...args: unknown[]) => {
    secureLogger.warn('CONSOLE', message, { args });
  }
};