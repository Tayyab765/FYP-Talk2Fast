import winston from 'winston';

const level = process.env.LOG_LEVEL || 'info';

// Custom format for better readability
const customFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Enhanced logger configuration
export const logger = winston.createLogger({
  level: level,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error'
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Enhanced info function
function info(msg) {
  if (['info'].includes(level)) {
    logger.info(`🟦 ${msg}`);
  }
}

// Enhanced error function
function error(msg) {
  logger.error(`🔴 ${msg}`);
}

// Enhanced debug function
function debug(msg) {
  if (['debug'].includes(level)) {
    logger.debug(`🟨 ${msg}`);
  }
}

// Enhanced warn function
function warn(msg) {
  logger.warn(`🟧 ${msg}`);
}

export { info, error, debug, warn };

// Enhanced morgan stream
export const stream = {
  write: (message) => {
    logger.info(`📨 ${message.trim()}`);
  }
};
