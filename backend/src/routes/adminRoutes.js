/**
 * ============================================
 * Admin Routes
 * ============================================
 * REST API routes for Admin Dashboard queries.
 * Secured by JWT authMiddleware.
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Admin log-in (public)
router.post('/login', adminController.login);

// Retrieve system statistics (requires admin auth)
router.get('/statistics', authMiddleware, adminController.getStatistics);

// Retrieve all applicants list (requires admin auth)
router.get('/applicants', authMiddleware, adminController.getAllApplicants);

// Retrieve individual applicant detail (requires admin auth)
router.get('/applicants/:id', authMiddleware, adminController.getApplicantDetail);

// Download candidate CV (requires admin auth)
router.get('/applicants/:id/download', authMiddleware, adminController.downloadCV);

// Update status of an interview (requires admin auth)
router.put('/applicants/:id/status', authMiddleware, adminController.updateStatus);

// Delete an interview completely (requires admin auth)
router.delete('/applicants/:id', authMiddleware, adminController.deleteApplicant);

// Schedule configuration routes (requires admin auth)
router.get('/schedule', authMiddleware, adminController.getSchedule);
router.post('/schedule', authMiddleware, adminController.updateSchedule);
router.post('/schedule/toggle', authMiddleware, adminController.toggleManualOpen);

// Duplicate management routes (requires admin auth)
router.get('/duplicates', authMiddleware, adminController.getDuplicateCandidates);
router.delete('/duplicates', authMiddleware, adminController.deleteAllDuplicates);

module.exports = router;
