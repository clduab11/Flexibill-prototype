import express, { Request, Response } from 'express';
const router = express.Router();
import { createLinkToken, exchangePublicToken, getUserAccounts, getItem, syncTransactions, handlePlaidWebhook } from '../services/PlaidService';
import { authenticateUser } from '../middleware/authMiddleware';
import { APIResponse } from '../utils/response';
import { DatabaseService } from '../db/DatabaseService';

// All Plaid routes should require authentication
router.use(authenticateUser);

router.post('/create-link-token', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      APIResponse.unauthorized(res, 'User authentication required');
      return;
    }
    
    console.log(`Creating Plaid Link token for user ${req.user.id}...`);
    const linkToken = await createLinkToken(req.user.id);
    
    APIResponse.success(res, { linkToken });
  } catch (error: any) {
    console.error('Error creating Plaid Link token:', error);
    APIResponse.error(
      res,
      'Failed to create link token',
      'PLAID_LINK_ERROR',
      500,
      error.message
    );
  }
});

router.post('/exchange-public-token', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      APIResponse.unauthorized(res, 'User authentication required');
      return;
    }
    
    const { publicToken, metadata } = req.body;
    
    if (!publicToken) {
      APIResponse.badRequest(res, 'Public token is required');
      return;
    }
    
    console.log(`Exchanging Plaid public token for user ${req.user.id}...`);
    const result = await exchangePublicToken(publicToken, metadata, req.user.id);
    
    APIResponse.success(res, { 
      success: true,
      itemId: result.itemID 
    });
  } catch (error: any) {
    console.error('Error exchanging Plaid public token:', error);
    APIResponse.error(
      res,
      'Failed to exchange public token',
      'PLAID_EXCHANGE_ERROR',
      500,
      error.message
    );
  }
});

// Add additional route to retrieve linked accounts
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      APIResponse.unauthorized(res, 'User authentication required');
      return;
    }
    
    // Get all accounts for the user
    const accounts = await getUserAccounts(req.user.id);
    
    APIResponse.success(res, { accounts });
  } catch (error: any) {
    console.error('Error retrieving accounts:', error);
    APIResponse.error(
      res,
      'Failed to retrieve accounts',
      'PLAID_ACCOUNTS_ERROR',
      500,
      error.message
    );
  }
});

// Add route to get item details
router.get('/item/:itemId', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      APIResponse.unauthorized(res, 'User authentication required');
      return;
    }
    
    const { itemId } = req.params;
    
    if (!itemId) {
      APIResponse.badRequest(res, 'Item ID is required');
      return;
    }
    
    // Validate that this item belongs to the authenticated user
    const db = DatabaseService.getInstance();
    const { data, error } = await db.getClient()
      .from('plaid_items')
      .select('*')
      .eq('item_id', itemId)
      .eq('user_id', req.user.id)
      .single();
      
    if (error || !data) {
      APIResponse.notFound(res, 'Item not found or does not belong to the authenticated user');
      return;
    }
    
    // Get item details
    const item = await getItem(itemId);
    
    APIResponse.success(res, { item });
  } catch (error: any) {
    console.error('Error retrieving item details:', error);
    APIResponse.error(
      res,
      'Failed to retrieve item details',
      'PLAID_ITEM_ERROR',
      500,
      error.message
    );
  }
});

// Add route to sync transactions
router.post('/sync-transactions', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      APIResponse.unauthorized(res, 'User authentication required');
      return;
    }

    const { itemId, startDate, endDate } = req.body;

    if (!itemId || !startDate || !endDate) {
      APIResponse.badRequest(res, 'Item ID, start date, and end date are required');
      return;
    }

    console.log(`Syncing transactions for item ${itemId} and user ${req.user.id}...`);
    const transactions = await syncTransactions(itemId, startDate, endDate);

    APIResponse.success(res, { transactions });
  } catch (error: any) {
    console.error('Error syncing transactions:', error);
    APIResponse.error(
      res,
      'Failed to sync transactions',
      'PLAID_SYNC_ERROR',
      500,
      error.message
    );
  }
});

// Add route to handle Plaid webhooks
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const webhookEvent = req.body;

    console.log('Received Plaid webhook event:', webhookEvent);
    await handlePlaidWebhook(webhookEvent);

    APIResponse.success(res, { message: 'Webhook event processed successfully' });
  } catch (error: any) {
    console.error('Error processing Plaid webhook event:', error);
    APIResponse.error(
      res,
      'Failed to process webhook event',
      'PLAID_WEBHOOK_ERROR',
      500,
      error.message
    );
  }
});

export default router;
