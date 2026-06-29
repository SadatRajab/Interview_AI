/**
 * ============================================
 * Violation Controller
 * ============================================
 * Records anti-cheating violations and handles
 * automatic disqualification when the limit is exceeded.
 */

const Applicant = require('../models/Applicant');
const scoringService = require('../services/scoringService');
const { validateRecordViolation } = require('../utils/validators');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * POST /api/violation/:id/record
 * Record a violation for an interview session.
 * If violation count exceeds the maximum, auto-disqualify.
 */
const recordViolation = async (req, res, next) => {
  try {
    const interview = req.interview; // Set by validateInterview middleware
    
    // Validate request body
    const validation = validateRecordViolation(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const { type, description } = req.body;
    logger.warn(`Recording anti-cheating violation [${type}] for session: ${interview._id}`);

    // Record the violation
    const violation = {
      type,
      timestamp: new Date(),
      description: description || `Violation: ${type}`,
      pointsDeducted: config.violationDeduction
    };

    interview.violations.push(violation);
    interview.violationCount = interview.violations.length;

    // Check if disqualification threshold is reached
    let disqualified = false;
    if (interview.violationCount >= config.maxViolations) {
      interview.status = 'disqualified';
      interview.completedAt = new Date();

      // Calculate final score with deductions applied
      const rawScore = scoringService.calculateCurrentScore(interview.answers);
      interview.finalScore = scoringService.calculateFinalScore(rawScore, interview.violationCount);

      disqualified = true;
      logger.error(`Disqualifying session ${interview._id} due to excessive violations (${interview.violationCount}/${config.maxViolations})`);
    }

    await interview.save();

    res.json({
      success: true,
      violationCount: interview.violationCount,
      maxViolations: config.maxViolations,
      disqualified,
      message: disqualified
        ? 'The interview has been cancelled due to a violation of the exam rules.'
        : `Violation recorded. Warning ${interview.violationCount} of ${config.maxViolations}.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/violation/:id/count
 * Get the current violation count for an interview.
 */
const getViolationCount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const interview = await Applicant.findOne({ sessionToken: id }).select('violationCount status');

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found.'
      });
    }

    res.json({
      success: true,
      violationCount: interview.violationCount,
      maxViolations: config.maxViolations,
      disqualified: interview.status === 'disqualified'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordViolation,
  getViolationCount
};
