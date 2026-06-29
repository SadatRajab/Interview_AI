/**
 * ============================================
 * Validate Interview Middleware
 * ============================================
 * Checks that an interview session exists and
 * is still active before allowing operations.
 * 
 * Rejects requests if:
 * - Interview ID is invalid
 * - Interview not found
 * - Interview is already completed/cancelled/disqualified
 */

const Applicant = require('../models/Applicant');
const { isValidObjectId } = require('../utils/validators');
const logger = require('../utils/logger');

const validateInterview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Interview ID is required'
      });
    }

    if (!id || id.length !== 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Interview ID format'
      });
    }

    const interview = await Applicant.findOne({ sessionToken: id });

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Check if interview is still active
    if (interview.status === 'disqualified') {
      logger.warn(`Action rejected: Interview ${id} is disqualified`);
      return res.status(403).json({
        success: false,
        error: 'This interview has been cancelled due to a violation of the exam rules.',
        status: 'disqualified'
      });
    }

    if (interview.status === 'completed') {
      logger.warn(`Action rejected: Interview ${id} is completed`);
      return res.status(403).json({
        success: false,
        error: 'This interview has already been completed.',
        status: 'completed'
      });
    }

    if (interview.status === 'cancelled') {
      logger.warn(`Action rejected: Interview ${id} is cancelled`);
      return res.status(403).json({
        success: false,
        error: 'This interview has been cancelled.',
        status: 'cancelled'
      });
    }

    // Attach interview to request for downstream use
    req.interview = interview;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validateInterview;
