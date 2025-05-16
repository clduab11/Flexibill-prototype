import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from '../utils/errors';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    throw new ValidationError('Validation failed', formattedErrors);
  };
};

// Common validation rules
export const commonValidations = {
  pagination: [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  dateRange: [
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate(),
  ],
  id: [
    param('id').isUUID().withMessage('Invalid ID format'),
  ],
  userId: [
    body('userId').isUUID().withMessage('Invalid user ID format'),
  ],
  accountId: [
    body('accountId').isUUID().withMessage('Invalid account ID format'),
  ],
  tags: [
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*').isString().withMessage('Each tag must be a string'),
  ],
  amount: [
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  ],
  date: [
    body('date').isISO8601().withMessage('Invalid date format'),
  ],
  name: [
    body('name').isString().trim().isLength({ min: 1, max: 255 })
      .withMessage('Name must be between 1 and 255 characters'),
  ],
  email: [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  ],
  password: [
    body('password')
      .isString()
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  ],
};

// Helper function to combine validation chains
export const combineValidations = (...validations: ValidationChain[][]) => {
  return validations.flat();
};

// Import necessary functions from express-validator
import { body, query, param } from 'express-validator';

// Example validation schemas
export const billValidations = {
  create: [
    ...commonValidations.name,
    ...commonValidations.amount,
    ...commonValidations.date,
    body('frequency')
      .isIn(['once', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'])
      .withMessage('Invalid frequency'),
    body('category').optional().isString(),
    body('autopay').optional().isBoolean(),
    body('reminderDays').optional().isArray(),
    body('reminderDays.*').optional().isInt({ min: 1, max: 30 }),
    body('notes').optional().isString().isLength({ max: 1000 }),
  ],
  update: [
    ...commonValidations.id,
    body('name').optional().isString().trim().isLength({ min: 1, max: 255 }),
    body('amount').optional().isFloat({ min: 0 }),
    body('dueDate').optional().isISO8601(),
    body('frequency').optional()
      .isIn(['once', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
    body('category').optional().isString(),
    body('autopay').optional().isBoolean(),
    body('reminderDays').optional().isArray(),
    body('reminderDays.*').optional().isInt({ min: 1, max: 30 }),
    body('notes').optional().isString().isLength({ max: 1000 }),
  ],
  delete: [
    ...commonValidations.id,
  ],
};

export const transactionValidations = {
  list: [
    ...commonValidations.pagination,
    ...commonValidations.dateRange,
    query('accountId').optional().isUUID(),
    query('category').optional().isString(),
    query('minAmount').optional().isFloat({ min: 0 }),
    query('maxAmount').optional().isFloat({ min: 0 }),
  ],
  updateTags: [
    ...commonValidations.id,
    ...commonValidations.tags,
  ],
};

export const accountValidations = {
  list: [
    ...commonValidations.pagination,
  ],
  sync: [
    ...commonValidations.accountId,
  ],
};
