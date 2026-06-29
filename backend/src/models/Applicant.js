/**
 * ============================================
 * Applicant / Interview Session Model
 * ============================================
 * Stores all data for a single interview session:
 * applicant info, CV, questions, answers, scores,
 * violations, and interview status.
 * 
 * IMPORTANT: Scores and evaluations are NEVER
 * returned to the frontend. They are stored here
 * for the future Admin Dashboard.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

// Sub-schema for individual answers
const answerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  answerText: {
    type: String,
    default: ''
  },
  evaluation: {
    type: String,
    default: ''
  },
  score: {
    type: Number,
    default: 0
  },
  answeredAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Sub-schema for violations
const violationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'tab_switch',
      'fullscreen_exit',
      'window_blur',
      'page_refresh',
      'devtools_open',
      'context_menu',
      'navigation_away',
      'browser_minimize'
    ]
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: ''
  },
  pointsDeducted: {
    type: Number,
    default: 0
  }
}, { _id: false });

const applicantSchema = new mongoose.Schema({
  sessionToken: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(16).toString('hex')
  },
  // ---- Applicant Info (for future use) ----
  applicantName: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },

  // ---- CV Data ----
  cvFilePath: {
    type: String,
    default: ''
  },
  cvOriginalName: {
    type: String,
    default: ''
  },
  cvText: {
    type: String,
    default: ''
  },

  // ---- Interview Data ----
  questions: {
    type: [String],
    default: []
  },
  answers: {
    type: [answerSchema],
    default: []
  },

  // ---- Scores (NEVER sent to frontend) ----
  currentScore: {
    type: Number,
    default: 0
  },
  finalScore: {
    type: Number,
    default: null
  },
  maxPossibleScore: {
    type: Number,
    default: 0
  },

  // ---- Violations ----
  violationCount: {
    type: Number,
    default: 0
  },
  violations: {
    type: [violationSchema],
    default: []
  },

  // ---- Status ----
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'disqualified'],
    default: 'pending'
  },

  // ---- Terms Agreement ----
  agreedToTerms: {
    type: Boolean,
    default: false
  },

  // ---- Timestamps ----
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for quick lookups
applicantSchema.index({ status: 1 });
applicantSchema.index({ createdAt: -1 });
applicantSchema.index({ sessionToken: 1 });

const Applicant = mongoose.model('Applicant', applicantSchema);

module.exports = Applicant;
