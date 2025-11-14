class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  formatMessage(level, message, requestId, ...args) {
    const requestIdPart = requestId ? `[${requestId}]` : '';
    const prefix = `[${level.toUpperCase()}]${requestIdPart ? ` ${requestIdPart}` : ''}`;
    
    if (args.length === 0) {
      return `${prefix} ${message}`;
    }
    
    if (this.isDevelopment || level === 'error') {
      try {
        const argsStr = args.map(arg => 
          arg instanceof Error ? { message: arg.message, stack: arg.stack } : arg
        );
        return `${prefix} ${message} ${JSON.stringify(argsStr)}`;
      } catch {
        return `${prefix} ${message} [Unable to stringify arguments]`;
      }
    }
    
    return `${prefix} ${message}`;
  }

  debug(message, ...args) {
    if (this.isDevelopment) {
      const requestId = this.extractRequestId(args);
      console.debug(this.formatMessage('debug', message, requestId, ...args));
    }
  }

  info(message, ...args) {
    const requestId = this.extractRequestId(args);
    console.info(this.formatMessage('info', message, requestId, ...args));
  }

  warn(message, ...args) {
    const requestId = this.extractRequestId(args);
    console.warn(this.formatMessage('warn', message, requestId, ...args));
  }

  error(message, error, ...args) {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    const requestId = this.extractRequestId(args);
    console.error(this.formatMessage('error', message, requestId, errorDetails, ...args));
  }

  extractRequestId(args) {
    for (const arg of args) {
      if (arg && typeof arg === 'object' && 'requestId' in arg) {
        return arg.requestId;
      }
    }
    return undefined;
  }
}

export const logger = new Logger();
