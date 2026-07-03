/**
 * ============================================
 * Schedule Middleware
 * ============================================
 * Checks if the interview period is active based on the
 * database schedule configuration and the current server time.
 * 
 * Rejects requests if:
 * - Interviews are manually closed by the admin.
 * - The current time is before the start time.
 * - The current time is after the end time.
 */

const Schedule = require('../models/Schedule');
const logger = require('../utils/logger');

const scheduleMiddleware = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne().sort({ createdAt: -1 });

    if (!schedule) {
      // If no schedule config exists, allow access by default to avoid system lockout
      return next();
    }

    const now = new Date();

    if (!schedule.isManualOpen) {
      logger.warn('Access blocked: Interviews are manually closed by the administrator.');
      return res.status(403).json({
        success: false,
        error: 'Interviews are currently closed.',
        code: 'MANUALLY_CLOSED'
      });
    }

    if (now < schedule.startDate) {
      logger.warn(`Access blocked: Interview period has not started yet. Current: ${now.toISOString()}, Start: ${schedule.startDate.toISOString()}`);
      return res.status(403).json({
        success: false,
        error: 'The interview period has not started yet.',
        code: 'NOT_STARTED',
        startDate: schedule.startDate
      });
    }

    if (now > schedule.endDate) {
      logger.warn(`Access blocked: Interview period has ended. Current: ${now.toISOString()}, End: ${schedule.endDate.toISOString()}`);
      return res.status(403).json({
        success: false,
        error: 'The interview period has ended.',
        code: 'ENDED',
        endDate: schedule.endDate
      });
    }

    // Interview is open and active
    next();
  } catch (error) {
    logger.error('Error in scheduleMiddleware:', { error: error.message });
    next(error);
  }
};

module.exports = scheduleMiddleware;
