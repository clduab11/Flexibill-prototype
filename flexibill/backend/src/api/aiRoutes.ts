import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import AIService from '../services/AIService';
import { DatabaseService } from '../db/DatabaseService';

interface PremiumInsight {
  id: string;
  type: 'spending_pattern' | 'bill_optimization' | 'saving_opportunity';
  title: string;
  description: string;
  impact: number;
  created_at: Date;
}


const router = express.Router();
const aiService = new AIService();
const db = DatabaseService.getInstance();

// Get bill recommendations
router.get('/bill-recommendations', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User ID is required' });
      return;
    }

    const { data: bills, error: billsError } = await db.getClient().from('bills').select('*').eq('user_id', userId);
    if (billsError) {
      throw new Error('Failed to fetch bills');
    }

    const { data: transactions, error: transactionsError } = await db.getClient().from('transactions').select('*').eq('user_id', userId);
    if (transactionsError) {
      throw new Error('Failed to fetch transactions');
    }

    const recommendations = await aiService.generateBillRecommendations(bills, transactions);
    res.json({ recommendations });
  } catch (error) {
    console.error('Error getting bill recommendations:', error);
    res.status(500).json({ error: 'Failed to get bill recommendations' });
  }
});

// Get cash flow analysis
router.get('/cash-flow', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User ID is required' });
      return;
    }

    const { data: transactions, error: transactionsError } = await db.getClient().from('transactions').select('*').eq('user_id', userId);
    if (transactionsError) {
      throw new Error('Failed to fetch transactions');
    }

    const { data: bills, error: billsError } = await db.getClient().from('bills').select('*').eq('user_id', userId);
    if (billsError) {
      throw new Error('Failed to fetch bills');
    }

    const analysis = await aiService.analyzeCashFlow(transactions, bills);
    res.json({ analysis });
  } catch (error) {
    console.error('Error getting cash flow analysis:', error);
    res.status(500).json({ error: 'Failed to get cash flow analysis' });
  }
});

// Get premium insights
router.get('/premium-insights', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User ID is required' });
      return;
    }

    const userSubscription = req.user?.subscription;
    if (userSubscription !== 'premium') {
      res.status(403).json({ error: 'Premium subscription required' });
      return;
    }

    // TODO: Implement premium insights
    const insights: PremiumInsight[] = [];
    res.json({ insights });
  } catch (error) {
    console.error('Error getting premium insights:', error);
    res.status(500).json({ error: 'Failed to get premium insights' });
  }
});

// Optimize bill schedule
router.post('/optimize-schedule', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User ID is required' });
      return;
    }

    const { bills } = req.body;
    if (!Array.isArray(bills)) {
      res.status(400).json({ error: 'Bills must be an array' });
      return;
    }

    // TODO: Implement bill schedule optimization
    const optimizedSchedule = bills.map(bill => ({
      ...bill,
      optimizedDueDate: new Date().toISOString()
    }));

    res.json({ optimizedSchedule });
  } catch (error) {
    console.error('Error optimizing bill schedule:', error);
    res.status(500).json({ error: 'Failed to optimize bill schedule' });
  }
});

// Get savings opportunities
router.get('/savings-opportunities', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User ID is required' });
      return;
    }

    const { data: transactions, error: transactionsError } = await db.getClient().from('transactions').select('*').eq('user_id', userId);
    if (transactionsError) {
      throw new Error('Failed to fetch transactions');
    }

    const { data: bills, error: billsError } = await db.getClient().from('bills').select('*').eq('user_id', userId);
    if (billsError) {
      throw new Error('Failed to fetch bills');
    }

    const opportunities = await aiService.detectSavingsOpportunities(transactions, bills);
    res.json({ opportunities });
  } catch (error) {
    console.error('Error getting savings opportunities:', error);
    res.status(500).json({ error: 'Failed to get savings opportunities' });
  }
});

export default router;
