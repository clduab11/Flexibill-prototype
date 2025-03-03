import express from 'express';
import { PlaidService, Transaction } from '../services/PlaidService';
import { SupabaseClient } from '@supabase/supabase-js';

export const createTransactionRoutes = (supabase: SupabaseClient) => {
  const router = express.Router();
  const plaidService = new PlaidService(supabase);

  // Middleware to verify user authentication
  const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
      
      // Add user ID to request for use in route handlers
      req.body.userId = user.id;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };

  // Apply authentication middleware to all routes
  router.use(authenticateUser);

  // Get all transactions for the authenticated user
  router.get('/', async (req, res) => {
    try {
      const userId = req.body.userId;
      
      // In a real implementation, this would fetch transactions from the database
      // For Phase 2, we'll use the mock transactions from PlaidService
      const transactions = await plaidService.syncTransactions(userId);
      
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // Sync transactions from Plaid
  router.post('/sync', async (req, res) => {
    try {
      const userId = req.body.userId;
      
      // Trigger a transaction sync
      const transactions = await plaidService.syncTransactions(userId);
      
      res.json({
        message: 'Transactions synced successfully',
        count: transactions.length,
        transactions
      });
    } catch (error) {
      console.error('Error syncing transactions:', error);
      res.status(500).json({ error: 'Failed to sync transactions' });
    }
  });

  // Get transaction categories
  router.get('/categories', async (req, res) => {
    try {
      // In a real implementation, this would fetch categories from Plaid
      // For Phase 2, return mock categories
      const categories = [
        'Housing',
        'Transportation',
        'Food',
        'Utilities',
        'Insurance',
        'Medical',
        'Debt',
        'Entertainment',
        'Personal',
        'Other'
      ];
      
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  return router;
};