/**
 * ============================================
 * Rate Limiter Middleware
 * ============================================
 * Basic rate limiting to prevent abuse.
 * Uses express-rate-limit for simplicity.
 */

const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // Max 200 requests per window
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // Max 10 uploads per window
  message: {
    success: false,
    error: 'Too many upload attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { apiLimiter, uploadLimiter };
