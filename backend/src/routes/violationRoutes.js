/**
 * ============================================
 * Violation Routes
 * ============================================
 * REST API routes for recording and querying
 * anti-cheating violations.
 */

const express = require('express');
const router = express.Router();
const validateInterview = require('../middleware/validateInterview');
const violationController = require('../controllers/violationController');

// Record a violation (requires active interview)
router.post('/:id/record', validateInterview, violationController.recordViolation);

// Get violation count
router.get('/:id/count', violationController.getViolationCount);

module.exports = router;
