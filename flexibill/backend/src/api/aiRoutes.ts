import express from 'express';
import { AIService } from '../services/AIService';
import { SupabaseClient } from '@supabase/supabase-js';

export const createAIRoutes = (supabase: SupabaseClient) => {
  const router = express.Router();
  const aiService = new AIService(supabase);

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

  // Get bill recommendations
  router.get('/bill-recommendations', async (req, res) => {
    try {
      const userId = req.body.userId;
      const recommendations = await aiService.analyzeBills(userId);
      res.json(recommendations);
    } catch (error) {
      console.error('Error getting bill recommendations:', error);
      res.status(500).json({ error: 'Failed to get bill recommendations' });
    }
  });

  // Get cash flow analysis
  router.get('/cash-flow', async (req, res) => {
    try {
      const userId = req.body.userId;
      const analysis = await aiService.getCashFlowAnalysis(userId);
      res.json(analysis);
    } catch (error) {
      console.error('Error getting cash flow analysis:', error);
      res.status(500).json({ error: 'Failed to get cash flow analysis' });
    }
  });

  // Get premium insights (for premium users only)
  router.get('/premium-insights', async (req, res) => {
    try {
      const userId = req.body.userId;
      
      // Check if user has premium subscription
      const { data: user, error } = await supabase
        .from('users')
        .select('subscription')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (user.subscription !== 'premium') {
        return res.status(403).json({ 
          error: 'Premium subscription required',
          message: 'Upgrade to premium to access this feature'
        });
      }
      
      const insights = await aiService.getPremiumInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error('Error getting premium insights:', error);
      res.status(500).json({ error: 'Failed to get premium insights' });
    }
  });

  return router;
};