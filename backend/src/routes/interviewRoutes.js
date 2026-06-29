/**
 * ============================================
 * Interview Routes
 * ============================================
 * REST API routes for interview operations.
 * File upload is handled by multer middleware.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const config = require('../config/config');
const validateInterview = require('../middleware/validateInterview');
const { uploadLimiter } = require('../middleware/rateLimiter');
const interviewController = require('../controllers/interviewController');

// ------------------------------------------
// Multer Configuration for CV uploads
// ------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (config.allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file format: ${ext}. Allowed: ${config.allowedFileTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxFileSize }
});

// ------------------------------------------
// Routes
// ------------------------------------------

// Upload CV file and extract text
router.post('/upload-cv', uploadLimiter, upload.single('file'), interviewController.uploadCV);

// Start interview (generate questions)
router.post('/start', interviewController.startInterview);

// Submit answer for a question (requires active interview)
router.post('/:id/answer', validateInterview, interviewController.submitAnswer);

// Finish interview (marks completed)
router.post('/:id/finish', validateInterview, interviewController.finishInterview);

// Get interview status
router.get('/:id/status', interviewController.getInterviewStatus);

// Get questions only
router.get('/:id/questions', interviewController.getQuestions);

module.exports = router;
