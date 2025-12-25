import { secureLogger } from './secureLogger';



class Logger {
  info(message: string, ...args: unknown[]) {
    secureLogger.info('LEGACY', message, { args });
  }

  warn(message: string, ...args: unknown[]) {
    secureLogger.warn('LEGACY', message, { args });
  }

  error(message: string, ...args: unknown[]) {
    secureLogger.error('LEGACY', message, { args });
  }

  debug(message: string, ...args: unknown[]) {
    secureLogger.debug('LEGACY', message, { args });
  }
}

export const logger = new Logger();
