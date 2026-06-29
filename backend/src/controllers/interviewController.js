/**
 * ============================================
 * Interview Controller
 * ============================================
 * Handles all interview-related business logic.
 * 
 * SECURITY: No score or evaluation data is ever
 * returned to the frontend from this controller.
 */

const Applicant = require('../models/Applicant');
const aiService = require('../services/aiService');
const scoringService = require('../services/scoringService');
const { validateStartInterview, validateSubmitAnswer } = require('../utils/validators');
const cvParser = require('../utils/cvParser');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * POST /api/interview/upload-cv
 * Upload a CV file and extract its text content.
 * Creates a new interview session in 'pending' status.
 */
const uploadCV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please provide a CV file.'
      });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    logger.info(`Starting CV upload process for: ${originalName}`);

    // Extract text from CV via AI API
    const cvText = await aiService.extractCV(filePath, originalName);

    // Extract basic details from CV content and filename
    const { applicantName, email, phone } = cvParser.extractApplicantInfo(cvText, originalName);

    // Create a new interview session
    const interview = new Applicant({
      applicantName,
      email,
      phone,
      cvFilePath: filePath,
      cvOriginalName: originalName,
      cvText: cvText,
      status: 'pending'
    });

    await interview.save();
    logger.info(`Interview session created successfully with Secure Token: ${interview.sessionToken}`);

    // Return secure session token as interviewId
    res.status(201).json({
      success: true,
      interviewId: interview.sessionToken,
      text: cvText
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interview/start
 * Start the interview: generate questions and update status.
 * Requires: interviewId, agreedToTerms
 */
const startInterview = async (req, res, next) => {
  try {
    // Validate request body
    const validation = validateStartInterview(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const { interviewId } = req.body;
    logger.info(`Starting interview session: ${interviewId}`);

    const interview = await Applicant.findOne({ sessionToken: interviewId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview session not found.'
      });
    }

    if (interview.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Interview has already been started or completed.'
      });
    }

    if (!interview.cvText) {
      return res.status(400).json({
        success: false,
        error: 'No CV text found. Please upload a CV first.'
      });
    }

    // Generate questions via AI API
    const questions = await aiService.generateQuestions(interview.cvText);
    if (!questions || questions.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate questions. Please try again.'
      });
    }

    // Update interview state
    interview.questions = questions;
    interview.status = 'in_progress';
    interview.startedAt = new Date();
    interview.agreedToTerms = true;
    interview.maxPossibleScore = scoringService.calculateMaxPossibleScore(questions.length);

    await interview.save();
    logger.info(`Questions generated and interview session is active for: ${interviewId}`);

    // Return questions (safe to show)
    res.json({
      success: true,
      interviewId: interview.sessionToken,
      questions: questions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interview/:id/answer
 * Submit an answer for a specific question.
 * Evaluates via AI and scores server-side.
 * Returns ONLY success status — NO score or evaluation.
 */
const submitAnswer = async (req, res, next) => {
  try {
    const interview = req.interview; // Set by validateInterview middleware
    
    // Validate request body
    const validation = validateSubmitAnswer(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const { questionIndex, answerText } = req.body;
    logger.info(`Submitting answer for question index ${questionIndex} in session: ${interview._id}`);

    if (questionIndex < 0 || questionIndex >= interview.questions.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid question index.'
      });
    }

    const questionText = interview.questions[questionIndex];

    // Evaluate answer via AI API (evaluation & score hidden from user)
    let evaluation = '';
    let score = config.defaultQuestionScore;

    try {
      evaluation = await aiService.evaluateAnswer(questionText, answerText.trim());
      score = scoringService.extractScoreFromEvaluation(evaluation);
    } catch (aiError) {
      logger.error('AI evaluation failed during submission, using default score', { error: aiError.message });
      evaluation = 'Evaluation temporarily unavailable.';
      score = config.defaultQuestionScore;
    }

    // Check if this question was already answered (update it)
    const existingIndex = interview.answers.findIndex(
      a => a.questionIndex === questionIndex
    );

    const answerData = {
      questionIndex,
      questionText,
      answerText: answerText.trim(),
      evaluation,
      score,
      answeredAt: new Date()
    };

    if (existingIndex >= 0) {
      interview.answers[existingIndex] = answerData;
    } else {
      interview.answers.push(answerData);
    }

    // Recalculate current score
    interview.currentScore = scoringService.calculateCurrentScore(interview.answers);

    await interview.save();
    logger.info(`Answer recorded and scored internally for question index ${questionIndex} in session: ${interview._id}`);

    // Return ONLY success — NO scores, NO evaluation
    res.json({
      success: true,
      questionIndex
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interview/:id/finish
 * End the interview and calculate final score.
 * Returns ONLY a confirmation message.
 */
const finishInterview = async (req, res, next) => {
  try {
    const interview = req.interview; // Set by validateInterview middleware
    logger.info(`Finishing interview session: ${interview._id}`);

    // Calculate final score with violation deductions
    const rawScore = scoringService.calculateCurrentScore(interview.answers);
    const finalScore = scoringService.calculateFinalScore(rawScore, interview.violationCount);

    interview.currentScore = rawScore;
    interview.finalScore = finalScore;
    interview.status = 'completed';
    interview.completedAt = new Date();

    await interview.save();
    logger.info(`Interview session ${interview._id} finished successfully. Final score calculated.`);

    // Return ONLY a generic message — NO scores
    res.json({
      success: true,
      message: 'Your answers have been received successfully and will be reviewed by the administrator.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/interview/:id/status
 * Get the current interview status.
 * Returns status and violation count only.
 */
const getInterviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const interview = await Applicant.findOne({ sessionToken: id }).select('status violationCount');

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found.'
      });
    }

    res.json({
      success: true,
      status: interview.status,
      violationCount: interview.violationCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/interview/:id/questions
 * Get questions only (no scores, no evaluations).
 */
const getQuestions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const interview = await Applicant.findOne({ sessionToken: id }).select('questions status');

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found.'
      });
    }

    res.json({
      success: true,
      questions: interview.questions,
      status: interview.status
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadCV,
  startInterview,
  submitAnswer,
  finishInterview,
  getInterviewStatus,
  getQuestions
};
