/**
 * ============================================
 * Application Configuration
 * ============================================
 * Central configuration for the interview system.
 * All configurable values (deduction points, limits, etc.)
 * are defined here for easy adjustment.
 */

const path = require('path');

module.exports = {
  // ------------------------------------------
  // Violation Settings
  // ------------------------------------------
  
  /** Maximum violations before automatic disqualification */
  maxViolations: 3,
  
  /** Points deducted from the total score per violation */
  violationDeduction: 5,

  // ------------------------------------------
  // Scoring Settings
  // ------------------------------------------
  
  /** Maximum score a single question can receive */
  maxScorePerQuestion: 10,
  
  /** Default score when AI evaluation cannot parse a numeric score */
  defaultQuestionScore: 5,

  // ------------------------------------------
  // Interview Settings
  // ------------------------------------------
  
  /** Maximum number of questions to generate per interview */
  maxQuestions: 10,

  // ------------------------------------------
  // File Upload Settings
  // ------------------------------------------
  
  /** Directory for storing uploaded CV files */
  uploadDir: path.join(__dirname, '../uploads'),
  
  /** Maximum file size in bytes (10 MB) */
  maxFileSize: 10 * 1024 * 1024,
  
  /** Allowed file extensions for CV upload */
  allowedFileTypes: ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'],

  // ------------------------------------------
  // AI API Settings
  // ------------------------------------------
  
  /** Base URL for the HuggingFace AI API */
  aiApiBase: process.env.AI_API_BASE || 'https://anwer-1-ineterviwe-ai.hf.space',

  // ------------------------------------------
  // JWT Settings for Admin Dashboard
  // ------------------------------------------
  jwtSecret: process.env.JWT_SECRET || 'super_secret_admin_dashboard_token_key',
  jwtExpiresIn: '1d',

  // ------------------------------------------
  // Admin Credentials (for initial setup/demo)
  // ------------------------------------------
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',

  // ------------------------------------------
  // Violation Types (used for consistent tracking)
  // ------------------------------------------
  violationTypes: {
    TAB_SWITCH: 'tab_switch',
    FULLSCREEN_EXIT: 'fullscreen_exit',
    WINDOW_BLUR: 'window_blur',
    PAGE_REFRESH: 'page_refresh',
    DEVTOOLS_OPEN: 'devtools_open',
    CONTEXT_MENU: 'context_menu',
    NAVIGATION_AWAY: 'navigation_away',
    BROWSER_MINIMIZE: 'browser_minimize'
  }
};
