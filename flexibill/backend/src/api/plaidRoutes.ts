import express, { Request, Response } from 'express';
const router = express.Router();
import { createLinkToken, exchangePublicToken, getUserAccounts, getItem } from '../services/PlaidService';
import { authenticateUser } from '../middleware/authMiddleware';
import { APIResponse } from '../utils/response';
import { DatabaseService } from '../db/DatabaseService';

// All Plaid routes should require authentication
router.use(authenticateUser);

router.post('/create-link-token', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return APIResponse.unauthorized(res, 'User authentication required');
    }
    
    console.log(`Creating Plaid Link token for user ${req.user.id}...`);
    const linkToken = await createLinkToken(req.user.id);
    
    return APIResponse.success(res, { linkToken });
  } catch (error: any) {
    console.error('Error creating Plaid Link token:', error);
    return APIResponse.error(
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
      return APIResponse.unauthorized(res, 'User authentication required');
    }
    
    const { publicToken, metadata } = req.body;
    
    if (!publicToken) {
      return APIResponse.badRequest(res, 'Public token is required');
    }
    
    console.log(`Exchanging Plaid public token for user ${req.user.id}...`);
    const result = await exchangePublicToken(publicToken, metadata, req.user.id);
    
    return APIResponse.success(res, { 
      success: true,
      itemId: result.itemID 
    });
  } catch (error: any) {
    console.error('Error exchanging Plaid public token:', error);
    return APIResponse.error(
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
      return APIResponse.unauthorized(res, 'User authentication required');
    }
    
    // Get all accounts for the user
    const accounts = await getUserAccounts(req.user.id);
    
    return APIResponse.success(res, { accounts });
  } catch (error: any) {
    console.error('Error retrieving accounts:', error);
    return APIResponse.error(
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
      return APIResponse.unauthorized(res, 'User authentication required');
    }
    
    const { itemId } = req.params;
    
    if (!itemId) {
      return APIResponse.badRequest(res, 'Item ID is required');
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
      return APIResponse.notFound(res, 'Item not found or does not belong to the authenticated user');
    }
    
    // Get item details
    const item = await getItem(itemId);
    
    return APIResponse.success(res, { item });
  } catch (error: any) {
    console.error('Error retrieving item details:', error);
    return APIResponse.error(
      res,
      'Failed to retrieve item details',
      'PLAID_ITEM_ERROR',
      500,
      error.message
    );
  }
});

export default router;
