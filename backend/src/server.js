/**
 * ============================================
 * Server Bootstrapper
 * ============================================
 * Connects to MongoDB database and listens for incoming connections.
 */

require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Start Listening
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ============================================');
      console.log(`🚀  Interview Backend running on port ${PORT}`);
      console.log(`🚀  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🚀  API Base URL: http://localhost:${PORT}/api`);
      console.log(`🚀  Health check: http://localhost:${PORT}/api/health`);
      console.log('🚀 ============================================');
      console.log('');
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error.message });
    process.exit(1);
  }
};

startServer();
