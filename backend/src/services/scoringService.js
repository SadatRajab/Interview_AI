/**
 * ============================================
 * Scoring Service
 * ============================================
 * Handles all score calculations server-side.
 * Scores are NEVER exposed to the frontend.
 * 
 * Responsibilities:
 * - Parse numeric scores from AI evaluation text
 * - Apply violation deductions
 * - Calculate final interview score
 */

const config = require('../config/config');

/**
 * Extract a numeric score from AI evaluation text.
 * The AI may return scores in various formats:
 *   "Score: 8/10", "7 out of 10", "Rating: 9", etc.
 * 
 * @param {string} evaluationText - Raw evaluation from AI
 * @returns {number} Extracted score (0 to maxScorePerQuestion)
 */
function extractScoreFromEvaluation(evaluationText) {
  if (!evaluationText || typeof evaluationText !== 'string') {
    return config.defaultQuestionScore;
  }

  // Pattern 1: "X/10" or "X / 10"
  const slashMatch = evaluationText.match(/(\d+(?:\.\d+)?)\s*\/\s*10/i);
  if (slashMatch) {
    const score = parseFloat(slashMatch[1]);
    return Math.min(Math.max(score, 0), config.maxScorePerQuestion);
  }

  // Pattern 2: "Score: X" or "Rating: X"
  const scoreMatch = evaluationText.match(/(?:score|rating|grade)\s*[:\-=]\s*(\d+(?:\.\d+)?)/i);
  if (scoreMatch) {
    const score = parseFloat(scoreMatch[1]);
    return Math.min(Math.max(score, 0), config.maxScorePerQuestion);
  }

  // Pattern 3: "X out of 10"
  const outOfMatch = evaluationText.match(/(\d+(?:\.\d+)?)\s*out\s*of\s*10/i);
  if (outOfMatch) {
    const score = parseFloat(outOfMatch[1]);
    return Math.min(Math.max(score, 0), config.maxScorePerQuestion);
  }

  // If no pattern found, return default
  return config.defaultQuestionScore;
}

/**
 * Calculate the current running score for an interview.
 * Sums all individual answer scores.
 * 
 * @param {Array} answers - Array of answer objects with scores
 * @returns {number} Total current score
 */
function calculateCurrentScore(answers) {
  if (!answers || answers.length === 0) return 0;
  return answers.reduce((total, answer) => total + (answer.score || 0), 0);
}

/**
 * Calculate the final score after applying violation deductions.
 * 
 * @param {number} rawScore - Total score from answers
 * @param {number} violationCount - Number of violations
 * @returns {number} Final score (minimum 0)
 */
function calculateFinalScore(rawScore, violationCount) {
  const deduction = violationCount * config.violationDeduction;
  return Math.max(rawScore - deduction, 0);
}

/**
 * Calculate the maximum possible score for an interview.
 * 
 * @param {number} questionCount - Number of questions
 * @returns {number} Maximum possible score
 */
function calculateMaxPossibleScore(questionCount) {
  return questionCount * config.maxScorePerQuestion;
}

module.exports = {
  extractScoreFromEvaluation,
  calculateCurrentScore,
  calculateFinalScore,
  calculateMaxPossibleScore
};
