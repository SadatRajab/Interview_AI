/**
 * ============================================
 * MongoDB Connection
 * ============================================
 * Connects to MongoDB using Mongoose.
 * Connection URI is read from environment variables.
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/interview_db';
    
    await mongoose.connect(uri);
    
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', { error: error.message });
    process.exit(1);
  }
};

module.exports = connectDB;
