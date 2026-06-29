/**
 * ============================================
 * Express Application Setup
 * ============================================
 * Configures express server, security middleware,
 * rate limiters, logging, routes, and error handling.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const config = require('./config/config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const interviewRoutes = require('./routes/interviewRoutes');
const violationRoutes = require('./routes/violationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ------------------------------------------
// Ensure uploads directory exists
// ------------------------------------------
const uploadsDir = config.uploadDir;
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info(`Created uploads directory at: ${uploadsDir}`);
}

// ------------------------------------------
// Middleware Configuration
// ------------------------------------------

// CORS — Allow Angular dev server or production URL
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Request Logger middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiter to all API endpoints
app.use('/api/', apiLimiter);

// Serve static uploaded files (if needed by Admin Dashboard to view CVs)
app.use('/uploads', express.static(uploadsDir));

// ------------------------------------------
// API Routes
// ------------------------------------------
app.use('/api/interview', interviewRoutes);
app.use('/api/violation', violationRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Interview Backend API is healthy and running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ------------------------------------------
// 404 Route Handler
// ------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ------------------------------------------
// Global Error Handler Middleware
// ------------------------------------------
app.use(errorHandler);

module.exports = app;
