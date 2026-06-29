/**
 * ============================================
 * JWT Authentication Middleware
 * ============================================
 * Secures routes requiring Admin access.
 * Verifies the JWT token passed in authorization headers.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No authorization token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Attach decoded payload (usually admin context) to request
    req.admin = decoded;
    next();
  } catch (error) {
    logger.warn('Failed admin authorization attempt', { error: error.message });
    return res.status(401).json({
      success: false,
      error: 'Session expired or token is invalid. Please log in again.'
    });
  }
};

module.exports = authMiddleware;
