import express from 'express';
import { Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { Bill, BillFrequency } from '@shared/types';
import { authenticateUser } from '../middleware/authMiddleware';
import { validate } from '../middleware/validation';
import BillService from '../services/BillService';
import { NotFoundError, ValidationError } from '../utils/errors';
import { APIResponse } from '../utils/response';

const router = express.Router();
const billService = new BillService();

// Validation schemas
const createBillValidation = [
  body('name').trim().notEmpty().withMessage('Bill name is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('dueDate').isISO8601().withMessage('Invalid due date format'),
  body('frequency')
    .isIn(['once', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] as BillFrequency[])
    .withMessage('Invalid frequency'),
  body('category').optional().isString(),
  body('autopay').isBoolean(),
  body('reminderDays').isArray(),
  body('reminderDays.*').isInt({ min: 1, max: 30 }),
  body('notes').optional().isString().isLength({ max: 1000 })
];

// Create bill
router.post('/', 
  authenticateUser,
  validate(createBillValidation),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        APIResponse.unauthorized(res);
        return;
      }

      const bill = await billService.createBill(userId, req.body);
      APIResponse.created(res, bill);
    } catch (error) {
      if (error instanceof ValidationError) {
        APIResponse.badRequest(res, error.message);
        return;
      }
      console.error('Error creating bill:', error);
      APIResponse.internalError(res);
    }
  }
);

// Get all bills for user
router.get('/',
  authenticateUser,
  validate([
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020, max: 2100 }),
    query('upcoming').optional().isBoolean(),
    query('days').optional().isInt({ min: 1, max: 365 })
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        APIResponse.unauthorized(res);
        return;
      }

      let bills: Bill[];
      
      if (req.query.upcoming === 'true') {
        const days = req.query.days ? parseInt(req.query.days as string) : 7;
        bills = await billService.getUpcomingBills(userId, days);
      } else if (req.query.month && req.query.year) {
        bills = await billService.getBillsForMonth(
          userId,
          parseInt(req.query.year as string),
          parseInt(req.query.month as string)
        );
      } else {
        bills = await billService.getUserBills(userId);
      }

      APIResponse.success(res, { bills });
    } catch (error) {
      console.error('Error fetching bills:', error);
      APIResponse.internalError(res);
    }
  }
);

// Get single bill
router.get('/:id',
  authenticateUser,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        APIResponse.unauthorized(res);
        return;
      }

      const bill = await billService.getBill(userId, req.params.id);
      APIResponse.success(res, { bill });
    } catch (error) {
      if (error instanceof NotFoundError) {
        APIResponse.notFound(res, error.message);
        return;
      }
      console.error('Error fetching bill:', error);
      APIResponse.internalError(res);
    }
  }
);

// Update bill
router.put('/:id',
  authenticateUser,
  validate([
    param('id').isUUID(),
    ...createBillValidation.map(validation => validation.optional())
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        APIResponse.unauthorized(res);
        return;
      }

      const bill = await billService.updateBill(userId, req.params.id, req.body);
      APIResponse.success(res, { bill });
    } catch (error) {
      if (error instanceof NotFoundError) {
        APIResponse.notFound(res, error.message);
        return;
      }
      if (error instanceof ValidationError) {
        APIResponse.badRequest(res, error.message);
        return;
      }
      console.error('Error updating bill:', error);
      APIResponse.internalError(res);
    }
  }
);

// Delete bill
router.delete('/:id',
  authenticateUser,
  validate([param('id').isUUID()]),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        APIResponse.unauthorized(res);
        return;
      }

      await billService.deleteBill(userId, req.params.id);
      APIResponse.noContent(res);
    } catch (error) {
      if (error instanceof NotFoundError) {
        APIResponse.notFound(res, error.message);
        return;
      }
      console.error('Error deleting bill:', error);
      APIResponse.internalError(res);
    }
  }
);

// Get overdue bills
router.get('/overdue',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        APIResponse.unauthorized(res);
        return;
      }

      const bills = await billService.getOverdueBills(userId);
      APIResponse.success(res, { bills });
    } catch (error) {
      console.error('Error fetching overdue bills:', error);
      APIResponse.internalError(res);
    }
  }
);

// Optimize bill schedule
router.post('/optimize',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        APIResponse.unauthorized(res);
        return;
      }

      await billService.optimizeBillSchedule(userId);
      APIResponse.success(res, { message: 'Bill schedule optimized successfully' });
    } catch (error) {
      console.error('Error optimizing bill schedule:', error);
      APIResponse.internalError(res);
    }
  }
);

// Request due date change
router.post('/:id/request-due-date-change',
  authenticateUser,
  validate([param('id').isUUID(), body('newDueDate').isISO8601().withMessage('Invalid due date format')]),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        APIResponse.unauthorized(res);
        return;
      }

      const { id } = req.params;
      const { newDueDate } = req.body;

      const updatedBill = await billService.requestDueDateChange(userId, id, newDueDate);
      APIResponse.success(res, { bill: updatedBill });
    } catch (error) {
      if (error instanceof NotFoundError) {
        APIResponse.notFound(res, error.message);
        return;
      }
      if (error instanceof ValidationError) {
        APIResponse.badRequest(res, error.message);
        return;
      }
      console.error('Error requesting due date change:', error);
      APIResponse.internalError(res);
    }
  }
);

// Detect bills from transactions
router.post('/detect-from-transactions',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        APIResponse.unauthorized(res);
        return;
      }

      const detectedBills = await billService.detectBillsFromTransactions(userId);
      APIResponse.success(res, { bills: detectedBills });
    } catch (error) {
      console.error('Error detecting bills from transactions:', error);
      APIResponse.internalError(res);
    }
  }
);

export default router;
