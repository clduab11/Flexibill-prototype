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
        return APIResponse.unauthorized(res);
      }

      const bill = await billService.createBill(userId, req.body);
      return APIResponse.created(res, bill);
    } catch (error) {
      if (error instanceof ValidationError) {
        return APIResponse.badRequest(res, error.message);
      }
      console.error('Error creating bill:', error);
      return APIResponse.internalError(res);
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
        return APIResponse.unauthorized(res);
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

      return APIResponse.success(res, { bills });
    } catch (error) {
      console.error('Error fetching bills:', error);
      return APIResponse.internalError(res);
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
        return APIResponse.unauthorized(res);
      }

      const bill = await billService.getBill(userId, req.params.id);
      return APIResponse.success(res, { bill });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return APIResponse.notFound(res, error.message);
      }
      console.error('Error fetching bill:', error);
      return APIResponse.internalError(res);
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
        return APIResponse.unauthorized(res);
      }

      const bill = await billService.updateBill(userId, req.params.id, req.body);
      return APIResponse.success(res, { bill });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return APIResponse.notFound(res, error.message);
      }
      if (error instanceof ValidationError) {
        return APIResponse.badRequest(res, error.message);
      }
      console.error('Error updating bill:', error);
      return APIResponse.internalError(res);
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
        return APIResponse.unauthorized(res);
      }

      await billService.deleteBill(userId, req.params.id);
      return APIResponse.noContent(res);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return APIResponse.notFound(res, error.message);
      }
      console.error('Error deleting bill:', error);
      return APIResponse.internalError(res);
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
        return APIResponse.unauthorized(res);
      }

      const bills = await billService.getOverdueBills(userId);
      return APIResponse.success(res, { bills });
    } catch (error) {
      console.error('Error fetching overdue bills:', error);
      return APIResponse.internalError(res);
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
        return APIResponse.unauthorized(res);
      }

      await billService.optimizeBillSchedule(userId);
      return APIResponse.success(res, { message: 'Bill schedule optimized successfully' });
    } catch (error) {
      console.error('Error optimizing bill schedule:', error);
      return APIResponse.internalError(res);
    }
  }
);

export default router;
