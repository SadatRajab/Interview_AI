/**
 * ============================================
 * Admin Controller
 * ============================================
 * Handles authentication, statistics calculations,
 * candidate listing (with sorting, paging, filtering),
 * details query, status updates, and deletions.
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const Applicant = require('../models/Applicant');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * POST /api/admin/login
 * Log in to the Admin Dashboard and obtain a JWT token.
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required.'
      });
    }

    // Verify admin credentials
    if (username !== config.adminUsername || password !== config.adminPassword) {
      logger.warn(`Failed login attempt for username: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please try again.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username, role: 'admin' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    logger.info(`Admin successfully logged in.`);

    res.json({
      success: true,
      token,
      expiresIn: config.jwtExpiresIn
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/applicants
 * Retrieve all applicants list with sorting, pagination, and filters.
 * Computes isDuplicate dynamically.
 */
const getAllApplicants = async (req, res, next) => {
  try {
    logger.info('Fetching all applicants from database for admin table...');
    const applicants = await Applicant.find({}).sort({ createdAt: -1 });

    // 1. Build duplicate lookup maps for in-memory O(N) evaluation
    const emailMap = new Map();
    const phoneMap = new Map();
    const nameMap = new Map();

    applicants.forEach(app => {
      if (app.email) {
        emailMap.set(app.email, (emailMap.get(app.email) || 0) + 1);
      }
      if (app.phone) {
        phoneMap.set(app.phone, (phoneMap.get(app.phone) || 0) + 1);
      }
      if (app.applicantName) {
        const normalized = app.applicantName.toLowerCase().trim();
        nameMap.set(normalized, (nameMap.get(normalized) || 0) + 1);
      }
    });

    // 2. Map all applicants with duplicate flags
    let mapped = applicants.map(app => {
      const isDupEmail = app.email && emailMap.get(app.email) > 1;
      const isDupPhone = app.phone && phoneMap.get(app.phone) > 1;
      const normalizedName = app.applicantName ? app.applicantName.toLowerCase().trim() : '';
      const isDupName = normalizedName && nameMap.get(normalizedName) > 1;
      
      return {
        _id: app._id,
        applicantName: app.applicantName,
        email: app.email,
        phone: app.phone,
        status: app.status,
        cvOriginalName: app.cvOriginalName,
        currentScore: app.currentScore,
        finalScore: app.finalScore,
        maxPossibleScore: app.maxPossibleScore,
        violationCount: app.violationCount,
        createdAt: app.createdAt,
        isDuplicate: !!(isDupEmail || isDupPhone || isDupName)
      };
    });

    // 3. Apply Search
    const search = (req.query.search || '').trim().toLowerCase();
    if (search) {
      mapped = mapped.filter(app => 
        (app.applicantName && app.applicantName.toLowerCase().includes(search)) ||
        (app.email && app.email.toLowerCase().includes(search)) ||
        (app.phone && app.phone.includes(search))
      );
    }

    // 4. Apply Status Filtering
    const status = req.query.status || '';
    if (status) {
      if (status === 'duplicate') {
        mapped = mapped.filter(app => app.isDuplicate);
      } else {
        mapped = mapped.filter(app => app.status === status);
      }
    }

    // 5. Apply Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    mapped.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      if (valA instanceof Date) valA = valA.getTime();
      if (valB instanceof Date) valB = valB.getTime();
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      // Handlings nulls
      if (valA === null || valA === undefined) return 1 * sortOrder;
      if (valB === null || valB === undefined) return -1 * sortOrder;

      if (valA < valB) return -1 * sortOrder;
      if (valA > valB) return 1 * sortOrder;
      return 0;
    });

    // 6. Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const paginatedData = mapped.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      total: mapped.length,
      page,
      limit,
      data: paginatedData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/applicants/:id
 * Retrieve full applicant interview details (including AI feedback, CV path, and all questions/answers/violations).
 */
const getApplicantDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching detailed interview session data: ${id}`);

    const applicant = await Applicant.findOne({ sessionToken: id });
    if (!applicant) {
      return res.status(404).json({
        success: false,
        error: 'Applicant session not found.'
      });
    }

    // Check if duplicate exists
    const emailMatch = applicant.email ? await Applicant.countDocuments({ email: applicant.email, sessionToken: { $ne: applicant.sessionToken } }) : 0;
    const phoneMatch = applicant.phone ? await Applicant.countDocuments({ phone: applicant.phone, sessionToken: { $ne: applicant.sessionToken } }) : 0;
    const nameMatch = applicant.applicantName ? await Applicant.countDocuments({ applicantName: applicant.applicantName, sessionToken: { $ne: applicant.sessionToken } }) : 0;
    
    const isDuplicate = (emailMatch > 0 || phoneMatch > 0 || nameMatch > 0);

    res.json({
      success: true,
      data: {
        ...applicant.toObject(),
        isDuplicate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/applicants/:id/download
 * Download candidate CV file.
 */
const downloadCV = async (req, res, next) => {
  try {
    const { id } = req.params;
    const applicant = await Applicant.findOne({ sessionToken: id });

    if (!applicant || !applicant.cvFilePath) {
      return res.status(404).json({
        success: false,
        error: 'CV file not found for this applicant.'
      });
    }

    if (!fs.existsSync(applicant.cvFilePath)) {
      return res.status(404).json({
        success: false,
        error: 'CV file does not exist on the server.'
      });
    }

    res.download(applicant.cvFilePath, applicant.cvOriginalName || 'CV.pdf');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/applicants/:id
 * Permanently delete the interview, answers, violations, and physical CV file.
 */
const deleteApplicant = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`Deleting applicant interview session: ${id}`);

    const applicant = await Applicant.findOne({ sessionToken: id });
    if (!applicant) {
      return res.status(404).json({
        success: false,
        error: 'Applicant session not found.'
      });
    }

    // 1. Delete CV file from filesystem if it exists
    if (applicant.cvFilePath) {
      fs.unlink(applicant.cvFilePath, (err) => {
        if (err) {
          logger.warn(`Failed to delete CV file: ${applicant.cvFilePath}`, { error: err.message });
        } else {
          logger.info(`Successfully deleted CV file: ${applicant.cvFilePath}`);
        }
      });
    }

    // 2. Delete database document
    await Applicant.findOneAndDelete({ sessionToken: id });

    res.json({
      success: true,
      message: 'Interview session and related files deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/statistics
 * Retrieve system-wide statistics (counts, averages, violations, and duplicates).
 */
const getStatistics = async (req, res, next) => {
  try {
    logger.info('Calculating system statistics...');
    const all = await Applicant.find({});

    const total = all.length;
    const completed = all.filter(a => a.status === 'completed').length;
    const ongoing = all.filter(a => a.status === 'in_progress').length;
    const cancelled = all.filter(a => a.status === 'cancelled').length;
    const disqualified = all.filter(a => a.status === 'disqualified').length;

    // Average final score (only for completed or disqualified sessions where finalScore is a number)
    const finishedWithScores = all.filter(a => a.finalScore !== null && a.finalScore !== undefined);
    const avgScore = finishedWithScores.length > 0
      ? parseFloat((finishedWithScores.reduce((sum, a) => sum + a.finalScore, 0) / finishedWithScores.length).toFixed(2))
      : 0;

    // Total violations count across all candidates
    const totalViolations = all.reduce((sum, a) => sum + (a.violationCount || 0), 0);

    // Number of duplicate candidates
    const emailMap = new Map();
    const phoneMap = new Map();
    const nameMap = new Map();

    all.forEach(app => {
      if (app.email) emailMap.set(app.email, (emailMap.get(app.email) || 0) + 1);
      if (app.phone) phoneMap.set(app.phone, (phoneMap.get(app.phone) || 0) + 1);
      if (app.applicantName) {
        const normalized = app.applicantName.toLowerCase().trim();
        nameMap.set(normalized, (nameMap.get(normalized) || 0) + 1);
      }
    });

    let duplicateCount = 0;
    all.forEach(app => {
      const isDupEmail = app.email && emailMap.get(app.email) > 1;
      const isDupPhone = app.phone && phoneMap.get(app.phone) > 1;
      const normalizedName = app.applicantName ? app.applicantName.toLowerCase().trim() : '';
      const isDupName = normalizedName && nameMap.get(normalizedName) > 1;
      if (isDupEmail || isDupPhone || isDupName) {
        duplicateCount++;
      }
    });

    res.json({
      success: true,
      data: {
        totalCandidates: total,
        completedInterviews: completed,
        ongoingInterviews: ongoing,
        cancelledInterviews: cancelled,
        disqualifiedInterviews: disqualified,
        totalViolations: totalViolations,
        averageScore: avgScore,
        duplicateCandidates: duplicateCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/applicants/:id/status
 * Manually update status of an interview.
 */
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'disqualified'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const applicant = await Applicant.findOneAndUpdate({ sessionToken: id }, { status }, { new: true });
    if (!applicant) {
      return res.status(404).json({
        success: false,
        error: 'Applicant session not found.'
      });
    }

    res.json({
      success: true,
      data: applicant
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getAllApplicants,
  getApplicantDetail,
  downloadCV,
  deleteApplicant,
  getStatistics,
  updateStatus
};
