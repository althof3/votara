import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import healthRouter from './routes/health.js';
import apiRouter from './routes/api.js';
import { startAllEventListeners } from './services/eventListener.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Routes
app.use('/health', healthRouter);
app.use('/api', apiRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  logger.info(`🚀 Votara Backend running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Start blockchain event listeners
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const rpcUrl = process.env.RPC_URL;

  if (contractAddress && contractAddress !== '' && contractAddress !== '0x') {
    if (!rpcUrl) {
      logger.warn('⚠️  RPC_URL not set. Event listeners disabled.');
      logger.warn('⚠️  Set RPC_URL in .env to enable blockchain event listeners');
    } else {
      try {
        logger.info(`🔗 Connecting to blockchain at ${rpcUrl}`);
        logger.info(`📝 Contract address: ${contractAddress}`);
        await startAllEventListeners();
        logger.info('✅ Blockchain event listeners started');
      } catch (error) {
        logger.error('❌ Failed to start event listeners:', error);
        logger.error('💡 This is normal if you are running in development without blockchain connection');
        logger.error('💡 The API will still work for non-blockchain features');
      }
    }
  } else {
    logger.warn('⚠️  CONTRACT_ADDRESS not set. Event listeners disabled.');
    logger.warn('💡 Set CONTRACT_ADDRESS in .env to enable blockchain event listeners');
    logger.warn('💡 The API will still work for non-blockchain features');
  }
});

export default app;

