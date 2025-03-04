import { DatabaseService, db } from '../DatabaseService';
import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError, ConnectionError } from '../errors';

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation(async (callback) => {
        // Simulate a successful response by default
        if (table === 'users' &&  (mockFunctions.select as jest.Mock).mock.calls[0]?.[0] === 'id') {
          return callback({ data: [{ id: '123' }], error: null });
        }
        return callback({ data: [], error: null });
      }),
    })),
  })),
}));

// Helper object to store the mock functions
const mockFunctions: { [key: string]: jest.Mock } = {};

describe('DatabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton instance to ensure clean state
    (DatabaseService as any).instance = undefined;

    // Reset mock functions
    const supabaseMock = require('@supabase/supabase-js').createClient();
    mockFunctions.from = supabaseMock.from as jest.Mock;
    mockFunctions.select = supabaseMock.from().select as jest.Mock;
    mockFunctions.limit = supabaseMock.from().select().limit as jest.Mock; // Corrected line
    mockFunctions.delete = supabaseMock.from().delete as jest.Mock;
    mockFunctions.neq = supabaseMock.from().delete().neq as jest.Mock;
  });

  describe('initialization', () => {
    it('should initialize Supabase client successfully', async () => {
      await db.initialize();
      expect(db.isConnected()).toBe(true);
    });

    it('should throw ConnectionError when initialization fails', async () => {
      process.env.SUPABASE_URL = '';
      process.env.SUPABASE_KEY = '';

      await expect(db.initialize()).rejects.toThrow(Error);
    });

    it('should not initialize if already initialized', async () => {
      const createClientMock = jest.spyOn(require('@supabase/supabase-js'), 'createClient');
      await db.initialize();
      await db.initialize(); // Second call should be a no-op
      expect(createClientMock).toHaveBeenCalledTimes(1); // Ensure createClient is only called once
    });
  });

  describe('database operations', () => {
    beforeEach(async () => {
      await db.initialize();
    });

    it('should get Supabase client correctly', () => {
      const client = db.getClient();
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(SupabaseClient);
    });

    it('should check connection status correctly', async () => {
      const mockFrom = db.getClient().from('users');
      const mockSelect = mockFrom.select as jest.Mock;
      const mockLimit = jest.fn().mockResolvedValueOnce({ data: [{ id: '123' }], error: null });
      mockSelect.mockReturnValueOnce({ limit: mockLimit });

      const isConnected = await db.checkConnection();
      expect(isConnected).toBe(true);
      expect(mockFrom.select).toHaveBeenCalledWith('id');
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should handle connection check failure', async () => {
      const mockFrom = db.getClient().from('users');
      const mockSelect = mockFrom.select as jest.Mock;
      const mockLimit = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'Error' } });
      mockSelect.mockReturnValueOnce({
        limit: mockLimit
      });

      const isConnected = await db.checkConnection();
      expect(isConnected).toBe(false);
      expect(mockFrom.select).toHaveBeenCalledWith('id');
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should clear database correctly', async () => {
      const mockFrom = db.getClient().from('users');
      const mockDelete = mockFrom.delete as jest.Mock;
      const mockNeq = jest.fn().mockResolvedValueOnce({ error: null });
      mockDelete.mockReturnValueOnce({
        neq: mockNeq
      });

      await db.clear();
      // Check users table
      expect(mockFrom.delete).toHaveBeenCalled();
      expect(mockNeq).toHaveBeenCalledWith('id', '0');

      // Check other tables
      const tables = ['bill_recommendations', 'transactions', 'bills', 'accounts', 'recurring_rules'];
      for (const table of tables) {
          expect(db.getClient().from(table).delete().neq).toHaveBeenCalledWith('id', '0');
      }
    });
  });

  describe('cleanup', () => {
    it('should destroy database connection successfully', async () => {
      await db.initialize();
      await db.destroy();
      expect(db.isConnected()).toBe(false);
    });

    it('should not destroy if not initialized', async () => {
      await db.destroy();
      expect(db.isConnected()).toBe(false);
    });
  });
});