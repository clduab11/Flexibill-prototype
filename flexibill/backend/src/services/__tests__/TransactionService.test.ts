import { Transaction, TransactionFilter } from '@shared/types';
import TransactionService from '../TransactionService';
import { Database } from '../../db/database';
import { NotFoundError, ValidationError } from '../../utils/errors';

// Mock the Database class
jest.mock('../../db/database', () => {
  return {
    Database: jest.fn().mockImplementation(() => ({
      transactions: {
        findByUserId: jest.fn(),
        bulkUpdate: jest.fn().mockResolvedValue(undefined),
        bulkCreate: jest.fn().mockResolvedValue(undefined),
        bulkDelete: jest.fn().mockResolvedValue(undefined)
      }
    }))
  };
});

describe('TransactionService', () => {
  let service: TransactionService;
  let mockDb: jest.Mocked<Database>;

  const mockTransaction: Transaction = {
    id: '123',
    userId: 'user123',
    accountId: 'account123',
    amount: 100,
    date: '2025-03-04',
    name: 'Test Transaction',
    merchantName: 'Test Merchant',
    category: ['Shopping'],
    pending: false,
    paymentChannel: 'online',
    isRecurring: false,
    tags: ['test'],
    created_at: new Date(),
    updated_at: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = new Database() as jest.Mocked<Database>;
    (Database as jest.MockedClass<typeof Database>).mockImplementation(() => mockDb);
    service = new TransactionService();
  });

  describe('getTransactions', () => {
    it('should filter transactions by date range', async () => {
      const transactions = [
        { ...mockTransaction, date: '2025-03-01' },
        { ...mockTransaction, date: '2025-03-15' },
        { ...mockTransaction, date: '2025-03-30' }
      ];

      mockDb.transactions.findByUserId = jest.fn().mockResolvedValue(transactions);

      const filter: TransactionFilter = {
        startDate: '2025-03-10',
        endDate: '2025-03-20'
      };

      const result = await service.getTransactions('user123', filter);
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2025-03-15');
    });

    it('should filter transactions by amount range', async () => {
      const transactions = [
        { ...mockTransaction, amount: 50 },
        { ...mockTransaction, amount: 100 },
        { ...mockTransaction, amount: 150 }
      ];

      mockDb.transactions.findByUserId = jest.fn().mockResolvedValue(transactions);

      const filter: TransactionFilter = {
        minAmount: 75,
        maxAmount: 125
      };

      const result = await service.getTransactions('user123', filter);
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(100);
    });

    it('should filter transactions by category', async () => {
      const transactions = [
        { ...mockTransaction, category: ['Shopping'] },
        { ...mockTransaction, category: ['Dining'] },
        { ...mockTransaction, category: ['Shopping', 'Online'] }
      ];

      mockDb.transactions.findByUserId = jest.fn().mockResolvedValue(transactions);

      const filter: TransactionFilter = {
        categories: ['Shopping']
      };

      const result = await service.getTransactions('user123', filter);
      expect(result).toHaveLength(2);
    });
  });

  describe('updateTransactionTags', () => {
    it('should update tags for a valid transaction', async () => {
      mockDb.transactions.findByUserId = jest.fn().mockResolvedValue([mockTransaction]);
      mockDb.transactions.bulkUpdate = jest.fn().mockResolvedValue(undefined);

      const newTags = ['test', 'updated'];
      const result = await service.updateTransactionTags('user123', '123', newTags);

      expect(result.tags).toEqual(newTags);
      expect(mockDb.transactions.bulkUpdate).toHaveBeenCalled();
    });

    it('should throw NotFoundError for non-existent transaction', async () => {
      mockDb.transactions.findByUserId = jest.fn().mockResolvedValue([]);

      await expect(
        service.updateTransactionTags('user123', '123', ['test'])
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for unauthorized access', async () => {
      mockDb.transactions.findByUserId = jest.fn().mockResolvedValue([
        { ...mockTransaction, userId: 'otherUser' }
      ]);

      await expect(
        service.updateTransactionTags('user123', '123', ['test'])
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('detectRecurringTransactions', () => {
    it('should identify recurring transactions', async () => {
      const transactions = [
        { ...mockTransaction, date: '2025-03-01', name: 'Netflix', amount: 15.99 },
        { ...mockTransaction, date: '2025-02-01', name: 'Netflix', amount: 15.99 },
        { ...mockTransaction, date: '2025-01-01', name: 'Netflix', amount: 15.99 }
      ];

      mockDb.transactions.findByUserId = jest.fn().mockResolvedValue(transactions);
      mockDb.transactions.bulkUpdate = jest.fn().mockResolvedValue(undefined);

      const result = await service.detectRecurringTransactions('user123');
      expect(result).toHaveLength(3);
      expect(result[0].isRecurring).toBe(true);
    });

    it('should not mark non-recurring transactions', async () => {
      const transactions = [
        { ...mockTransaction, date: '2025-03-01', name: 'Random Purchase', amount: 25.00 },
        { ...mockTransaction, date: '2025-02-15', name: 'Another Purchase', amount: 30.00 }
      ];

      mockDb.transactions.findByUserId = jest.fn().mockResolvedValue(transactions);
      mockDb.transactions.bulkUpdate = jest.fn().mockResolvedValue(undefined);

      const result = await service.detectRecurringTransactions('user123');
      expect(result).toHaveLength(0);
    });
  });

  describe('categorizeTransactions', () => {
    it('should categorize transactions correctly', async () => {
      const transactions = [
        { ...mockTransaction, name: 'UBER TRIP' },
        { ...mockTransaction, name: 'WALMART GROCERY' },
        { ...mockTransaction, name: 'NETFLIX SUBSCRIPTION' }
      ];

      mockDb.transactions.bulkUpdate = jest.fn().mockResolvedValue(undefined);

      const result = await service.categorizeTransactions('user123', transactions);
      
      expect(result[0].category).toContain('Transportation');
      expect(result[1].category).toContain('Groceries');
      expect(result[2].category).toContain('Entertainment');
      expect(result[2].category).toContain('Subscription');
    });

    it('should mark uncategorized transactions', async () => {
      const transactions = [
        { ...mockTransaction, name: 'RANDOM PURCHASE' }
      ];

      mockDb.transactions.bulkUpdate = jest.fn().mockResolvedValue(undefined);

      const result = await service.categorizeTransactions('user123', transactions);
      expect(result[0].category).toContain('Uncategorized');
    });

    it('should throw ValidationError for unauthorized transactions', async () => {
      const transactions = [
        { ...mockTransaction, userId: 'otherUser' }
      ];

      await expect(
        service.categorizeTransactions('user123', transactions)
      ).rejects.toThrow(ValidationError);
    });
  });
});