import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, service }) => {
  return `${timestamp} [${service}] ${level}: ${stack || message}`;
});

/**
 * Create a logger instance for a service
 * @param {string} serviceName - Name of the service
 * @returns {winston.Logger}
 */
export function createLogger(serviceName) {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console({
        format: combine(
          colorize(),
          logFormat
        )
      }),
      new winston.transports.File({
        filename: `logs/${serviceName}-error.log`,
        level: 'error'
      }),
      new winston.transports.File({
        filename: `logs/${serviceName}.log`
      })
    ]
  });
}
