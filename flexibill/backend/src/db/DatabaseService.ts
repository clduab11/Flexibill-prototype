import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Account, Bill, BillRecommendation, Transaction } from '../entities'; // Import from entities
import { DatabaseError } from './errors';

export class DatabaseService {
  private static instance: DatabaseService;
  private supabase: SupabaseClient;
  private isInitialized = false;

  private constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and API key are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // No specific initialization needed for Supabase client
      this.isInitialized = true;
      console.log('Supabase client initialized successfully');
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      throw new DatabaseError('Failed to initialize Supabase client', { cause: error }); // Correctly pass the error
    }
  }

  public async destroy(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    // No specific connection closing needed for Supabase client
    this.isInitialized = false;
    console.log('Supabase client connection closed');
  }

  public getClient(): SupabaseClient {
    if (!this.isInitialized) {
      throw new Error('Database service is not initialized');
    }
    return this.supabase;
  }

  public isConnected(): boolean {
    return this.isInitialized;
  }

  public async checkConnection(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const { data, error } = await this.supabase.from('users').select('id').limit(1);
      if (error) {
        console.error('Database connection check failed:', error);
        return false;
      }
      return data !== null;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }

  public async clear(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Database service is not initialized');
    }

    const tables = ['bill_recommendations', 'transactions', 'bills', 'accounts', 'users', 'recurring_rules'];
    for (const table of tables) {
      const { error } = await this.supabase.from(table).delete().neq('id', '0'); // Use a non-matching condition
      if (error) {
        console.error(`Error clearing table ${table}:`, error);
        throw new DatabaseError(`Failed to clear table ${table}`, error);
      }
    }
  }

  // CRUD operations will be handled directly through the Supabase client
  // in the service layer (e.g., BillService, TransactionService).
  // We provide helper functions to get the Supabase query builder for each table.

  public users() {
    return this.supabase.from<User>('users');
  }

  public accounts() {
    return this.supabase.from<Account>('accounts');
  }

  public bills() {
    return this.supabase.from<Bill>('bills');
  }

  public billRecommendations() {
    return this.supabase.from<BillRecommendation>('bill_recommendations');
  }

  public transactions() {
    return this.supabase.from<Transaction>('transactions');
  }
}

// Export a singleton instance
export const db = DatabaseService.getInstance();