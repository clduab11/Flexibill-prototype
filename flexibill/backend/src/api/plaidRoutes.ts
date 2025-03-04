import express, { Request, Response } from 'express';
const router = express.Router();
import { createLinkToken, exchangePublicToken } from '../services/PlaidService';

router.post('/create-link-token', async (req: Request, res: Response) => {
  try {
    console.log('Creating Plaid Link token...');
    const linkToken = await createLinkToken();
    console.log('Plaid Link token created:', linkToken);
    res.json({ linkToken });
  } catch (error) {
    console.error('Error creating Plaid Link token:', error);
    res.status(500).json({ error: 'Failed to create link token.' });
  }
});

router.post('/exchange-public-token', async (req: Request, res: Response) => {
  try {
    console.log('Exchanging Plaid public token...', req.body);
    const { publicToken, metadata } = req.body;
    const result = await exchangePublicToken(publicToken, metadata);
    console.log('Plaid public token exchange result:', result);
    res.json({ success: true });
  } catch (error) {
    console.error('Error exchanging Plaid public token:', error);
    res.status(500).json({ error: 'Failed to exchange public token.' });
  }
});

export default router;