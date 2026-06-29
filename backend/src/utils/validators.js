/**
 * ============================================
 * Input Validators
 * ============================================
 * Validation helper functions for incoming requests.
 */

const mongoose = require('mongoose');
const config = require('../config/config');

/**
 * Validates MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validates Start Interview Request body
 */
const validateStartInterview = (body) => {
  const { interviewId, agreedToTerms } = body;
  const errors = [];

  if (!interviewId) {
    errors.push('interviewId is required');
  } else if (!isValidObjectId(interviewId)) {
    errors.push('interviewId is invalid');
  }

  if (agreedToTerms !== true) {
    errors.push('agreedToTerms must be true');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates Submit Answer Request body
 */
const validateSubmitAnswer = (body) => {
  const { questionIndex, answerText } = body;
  const errors = [];

  if (questionIndex === undefined || questionIndex === null) {
    errors.push('questionIndex is required');
  } else if (typeof questionIndex !== 'number' || questionIndex < 0) {
    errors.push('questionIndex must be a non-negative number');
  }

  if (!answerText || typeof answerText !== 'string' || !answerText.trim()) {
    errors.push('answerText is required and must be a non-empty string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates Record Violation Request body
 */
const validateRecordViolation = (body) => {
  const { type, description } = body;
  const errors = [];
  const validTypes = Object.values(config.violationTypes);

  if (!type) {
    errors.push('Violation type is required');
  } else if (!validTypes.includes(type)) {
    errors.push(`Invalid violation type. Allowed: ${validTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  isValidObjectId,
  validateStartInterview,
  validateSubmitAnswer,
  validateRecordViolation
};
