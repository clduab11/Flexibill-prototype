import express from 'express';
import { Request, Response } from 'express';
import { body, query, param } from 'express-validator';
import { Transaction, TransactionFilter } from '@shared/types';
import { authenticateUser } from '../middleware/authMiddleware';
import { validate } from '../middleware/validation';
import TransactionService from '../services/TransactionService';
import { NotFoundError, ValidationError } from '../utils/errors';
import { APIResponse } from '../utils/response';

const router = express.Router();
const transactionService = new TransactionService();

// Validation schemas
const transactionFilterValidation = [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('minAmount').optional().isFloat({ min: 0 }),
  query('maxAmount').optional().isFloat({ min: 0 }),
  query('categories').optional().isArray(),
  query('categories.*').optional().isString(),
  query('merchants').optional().isArray(),
  query('merchants.*').optional().isString(),
  query('tags').optional().isArray(),
  query('tags.*').optional().isString(),
  query('excludeCategories').optional().isArray(),
  query('excludeCategories.*').optional().isString(),
  query('excludeMerchants').optional().isArray(),
  query('excludeMerchants.*').optional().isString(),
  query('excludeTags').optional().isArray(),
  query('excludeTags.*').optional().isString(),
  query('isRecurring').optional().isBoolean(),
  query('searchTerm').optional().isString(),
  query('accountIds').optional().isArray(),
  query('accountIds.*').optional().isUUID(),
  query('pending').optional().isBoolean(),
  query('paymentChannels').optional().isArray(),
  query('paymentChannels.*').optional().isIn(['online', 'in store', 'other'])
];

// Get transactions with filtering
router.get('/',
  authenticateUser,
  validate(transactionFilterValidation),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        APIResponse.unauthorized(res);
        return;
      }

      const filter: TransactionFilter = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        categories: req.query.categories as string[] | undefined,
        merchants: req.query.merchants as string[] | undefined,
        tags: req.query.tags as string[] | undefined,
        excludeCategories: req.query.excludeCategories as string[] | undefined,
        excludeMerchants: req.query.excludeMerchants as string[] | undefined,
        excludeTags: req.query.excludeTags as string[] | undefined,
        isRecurring: req.query.isRecurring === 'true' ? true : 
                    req.query.isRecurring === 'false' ? false : undefined,
        searchTerm: req.query.searchTerm as string | undefined,
        accountIds: req.query.accountIds as string[] | undefined,
        pending: req.query.pending === 'true' ? true :
                req.query.pending === 'false' ? false : undefined,
        paymentChannels: req.query.paymentChannels as ('online' | 'in store' | 'other')[] | undefined
      };

      const transactions = await transactionService.getTransactions(userId, filter);
      APIResponse.success(res, { transactions });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      APIResponse.internalError(res);
    }
  }
);

// Update transaction tags
router.put('/:id/tags',
  authenticateUser,
  validate([
    param('id').isUUID(),
    body('tags').isArray(),
    body('tags.*').isString().trim().notEmpty()
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        APIResponse.unauthorized(res);
        return;
      }

      const transaction = await transactionService.updateTransactionTags(
        userId,
        req.params.id,
        req.body.tags
      );
      APIResponse.success(res, { transaction });
    } catch (error) {
      if (error instanceof NotFoundError) {
        APIResponse.notFound(res, error.message);
        return;
      }
      if (error instanceof ValidationError) {
        APIResponse.badRequest(res, error.message);
        return;
      }
      console.error('Error updating transaction tags:', error);
      APIResponse.internalError(res);
    }
  }
);

// Get recurring transactions
router.get('/recurring',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        APIResponse.unauthorized(res);
        return;
      }

      const transactions = await transactionService.detectRecurringTransactions(userId);
      APIResponse.success(res, { transactions });
    } catch (error) {
      console.error('Error detecting recurring transactions:', error);
      APIResponse.internalError(res);
    }
  }
);

// Categorize transactions
router.post('/categorize',
  authenticateUser,
  validate([
    body().isArray(),
    body('*.id').isUUID(),
    body('*.userId').custom((value, { req }) => value === req.user?.id)
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        APIResponse.unauthorized(res);
        return;
      }

      const transactions = await transactionService.categorizeTransactions(
        userId,
        req.body as Transaction[]
      );
      APIResponse.success(res, { transactions });
    } catch (error) {
      if (error instanceof ValidationError) {
        APIResponse.badRequest(res, error.message);
        return;
      }
      console.error('Error categorizing transactions:', error);
      APIResponse.internalError(res);
    }
  }
);

// Generate transaction summaries and analysis
router.get('/summaries',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        APIResponse.unauthorized(res);
        return;
      }

      const summaries = await transactionService.generateTransactionSummaries(userId);
      APIResponse.success(res, { summaries });
    } catch (error) {
      console.error('Error generating transaction summaries:', error);
      APIResponse.internalError(res);
    }
  }
);

// Analyze transactions
router.get('/analysis',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        APIResponse.unauthorized(res);
        return;
      }

      const analysis = await transactionService.analyzeTransactions(userId);
      APIResponse.success(res, { analysis });
    } catch (error) {
      console.error('Error analyzing transactions:', error);
      APIResponse.internalError(res);
    }
  }
);

export default router;
