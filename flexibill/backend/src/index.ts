import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import plaidRoutes from './api/plaidRoutes';
import billRoutes from './api/billRoutes';
import aiRoutes from './api/aiRoutes';
import transactionRoutes from './api/transactionRoutes';
import authRoutes from './api/authRoutes';
import { DatabaseService } from './db/DatabaseService';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database connection
const db = DatabaseService.getInstance();
db.initialize().catch(err => {
  console.error('Failed to initialize database connection:', err);
  process.exit(1);
});
console.log('Database connection initialized');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/plaid', plaidRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Global error handler
interface APIError extends Error {
  status?: number;
  code?: string;
}

app.use((err: APIError, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  const statusCode = err.status || 500;
  const errorResponse = {
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    }
  };

  res.status(statusCode).json(errorResponse);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
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