import express from 'express';
import { BillService, Bill, DateChangeRequest } from '../services/BillService';
import { SupabaseClient } from '@supabase/supabase-js';

export const createBillRoutes = (supabase: SupabaseClient) => {
  const router = express.Router();
  const billService = new BillService(supabase);

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

  // Get all bills for the authenticated user
  router.get('/', async (req, res) => {
    try {
      const userId = req.body.userId;
      const bills = await billService.getBills(userId);
      res.json(bills);
    } catch (error) {
      console.error('Error fetching bills:', error);
      res.status(500).json({ error: 'Failed to fetch bills' });
    }
  });

  // Add a new bill
  router.post('/', async (req, res) => {
    try {
      const bill: Bill = {
        ...req.body,
        userId: req.body.userId
      };
      
      const newBill = await billService.addBill(bill);
      res.status(201).json(newBill);
    } catch (error) {
      console.error('Error adding bill:', error);
      res.status(500).json({ error: 'Failed to add bill' });
    }
  });

  // Update an existing bill
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.body.userId;
      
      // Verify the bill belongs to the authenticated user
      const bills = await billService.getBills(userId);
      const bill = bills.find(b => b.id === id);
      
      if (!bill) {
        return res.status(404).json({ error: 'Bill not found or does not belong to user' });
      }
      
      const updatedBill = await billService.updateBill(id, req.body);
      res.json(updatedBill);
    } catch (error) {
      console.error('Error updating bill:', error);
      res.status(500).json({ error: 'Failed to update bill' });
    }
  });

  // Delete a bill
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.body.userId;
      
      // Verify the bill belongs to the authenticated user
      const bills = await billService.getBills(userId);
      const bill = bills.find(b => b.id === id);
      
      if (!bill) {
        return res.status(404).json({ error: 'Bill not found or does not belong to user' });
      }
      
      await billService.deleteBill(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting bill:', error);
      res.status(500).json({ error: 'Failed to delete bill' });
    }
  });

  // Request a due date change
  router.post('/:id/request-date-change', async (req, res) => {
    try {
      const { id } = req.params;
      const { requestedDueDate } = req.body;
      const userId = req.body.userId;
      
      // Verify the bill belongs to the authenticated user
      const bills = await billService.getBills(userId);
      const bill = bills.find(b => b.id === id);
      
      if (!bill) {
        return res.status(404).json({ error: 'Bill not found or does not belong to user' });
      }
      
      const request: DateChangeRequest = {
        billId: id,
        userId,
        currentDueDate: bill.dueDate,
        requestedDueDate,
        status: 'pending'
      };
      
      const result = await billService.requestDateChange(request);
      
      // Generate email template for Phase 1
      const emailTemplate = billService.generateEmailTemplate(request, bill);
      
      res.json({
        request: result,
        emailTemplate
      });
    } catch (error) {
      console.error('Error requesting date change:', error);
      res.status(500).json({ error: 'Failed to request date change' });
    }
  });

  return router;
};