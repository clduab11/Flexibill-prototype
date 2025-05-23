import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import plaidRoutes from './api/plaidRoutes';
import billRoutes from './api/billRoutes';
import aiRoutes from './api/aiRoutes';
import transactionRoutes from './api/transactionRoutes';
import authRoutes from './api/authRoutes';
import { DatabaseService } from './db/DatabaseService';
import { apiRateLimiter, authRateLimiter, plaidRateLimiter } from './middleware/rateLimit';
import config from './config/environment';
import { globalErrorHandler, notFoundHandler } from './middleware/errorMiddleware';

// Create Express app
const app = express();
const PORT = config.port;

// Initialize database connection
const db = DatabaseService.getInstance();
db.initialize().catch(err => {
  console.error('Failed to initialize database connection:', err);
  process.exit(1);
});
console.log('Database connection initialized');

// Security middleware
app.use(helmet()); // Add security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all API routes
app.use('/api', apiRateLimiter);

// Apply auth rate limiting to specific routes
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api/auth/forgot-password', authRateLimiter);

// Apply Plaid-specific rate limiting
app.use('/api/plaid', plaidRateLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/plaid', plaidRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    environment: config.env
  });
});

// 404 handler for routes not found
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    try {
      await db.destroy();
      console.log('Database connection closed');
      console.log('HTTP server closed');
      process.exit(0);
    } catch (err) {
      console.error('Error during graceful shutdown:', err);
      process.exit(1);
    }
  });
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  server.close(async () => {
    try {
      await db.destroy();
      console.log('Database connection closed');
    } catch (err) {
      console.error('Error closing database connection:', err);
    } finally {
      process.exit(1);
    }
  });
});

process.on('unhandledRejection', (reason: Error | any) => {
  console.error('Unhandled Rejection:', reason);
  server.close(async () => {
    try {
      await db.destroy();
      console.log('Database connection closed');
    } catch (err) {
      console.error('Error closing database connection:', err);
    } finally {
      process.exit(1);
    }
  });
});

export default server;
