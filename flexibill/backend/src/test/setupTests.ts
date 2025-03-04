import { Transaction } from '@shared/types';
import { setupTestDb, teardownTestDb } from '../db/testutils';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveMatchingTransactions(expected: Partial<Transaction>[]): R;
    }
  }

  // Add custom utilities to the global scope
  var mockDate: (date: string | Date) => void;
  var createMockTransaction: (overrides?: Partial<Transaction>) => Transaction;
}

// Original Date implementation
const RealDate = Date;

// Add global test setup
beforeEach(async () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  global.Date = RealDate;
  await setupTestDb();
});

afterEach(async () => {
  await teardownTestDb();
});

// Add global test utilities
global.mockDate = (date: string | Date) => {
  const mockDate = new Date(date);
  class MockDate extends Date {
    constructor(date?: string | number | Date) {
      if (date) {
        super(date);
        return this;
      }
      return mockDate;
    }
  }
  global.Date = MockDate as DateConstructor;
};

// Default mock transaction creator
global.createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'test-id',
  userId: 'test-user',
  accountId: 'test-account',
  amount: 100,
  date: '2025-03-04',
  name: 'Test Transaction',
  merchantName: 'Test Merchant',
  category: ['Shopping'],
  pending: false,
  paymentChannel: 'online',
  isRecurring: false,
  tags: ['test'],
  created_at: new Date('2025-03-04'),
  updated_at: new Date('2025-03-04'),
  ...overrides
});

// Add custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveMatchingTransactions(
    received: Transaction[],
    expected: Partial<Transaction>[]
  ) {
    const matches = expected.every(expectedTx =>
      received.some(receivedTx => {
        return Object.entries(expectedTx).every(([key, value]) => {
          if (Array.isArray(value)) {
            return JSON.stringify(receivedTx[key as keyof Transaction]) === JSON.stringify(value);
          }
          return receivedTx[key as keyof Transaction] === value;
        });
      })
    );

    if (matches) {
      return {
        message: () =>
          `expected transactions not to match ${JSON.stringify(expected)}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected transactions to match ${JSON.stringify(expected)}\nreceived: ${JSON.stringify(received)}`,
        pass: false,
      };
    }
  },
});

// Mock console methods to reduce noise in tests
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
} as Partial<Console>;

global.console = {
  ...console,
  ...mockConsole
};

// Clear mocks before each test
beforeEach(() => {
  (mockConsole.log as jest.Mock).mockClear();
  (mockConsole.error as jest.Mock).mockClear();
  (mockConsole.warn as jest.Mock).mockClear();
  (mockConsole.info as jest.Mock).mockClear();
  (mockConsole.debug as jest.Mock).mockClear();
});