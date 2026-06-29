/**
 * ============================================
 * Logger Utility
 * ============================================
 * Production-ready logger for the backend.
 * Supports different log levels and formats output with timestamps.
 */

const levels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLevel = process.env.LOG_LEVEL || 'INFO';

const log = (level, message, meta = '') => {
  if (levels[level] <= levels[currentLevel]) {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
    console.log(`[${timestamp}] [${level}] ${message}${metaString}`);
  }
};

module.exports = {
  error: (msg, meta) => log('ERROR', msg, meta),
  warn: (msg, meta) => log('WARN', msg, meta),
  info: (msg, meta) => log('INFO', msg, meta),
  debug: (msg, meta) => log('DEBUG', msg, meta)
};
