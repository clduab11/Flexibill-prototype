import { 
  Configuration, 
  PlaidApi, 
  PlaidEnvironments, 
  Products, 
  CountryCode,
  DepositoryAccountSubtype
} from 'plaid';
import { ItemGetRequest, TransactionsGetRequest } from 'plaid';
import { DatabaseService } from '../db/DatabaseService';
import { PlaidError, NotFoundError } from '../utils/errors';
import { encrypt, decrypt } from '../utils/encryption';

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
const PLAID_WEBHOOK_URL = process.env.PLAID_WEBHOOK_URL;

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

export async function createLinkToken(userId: string) {
  try {
    console.log(`Creating Plaid Link token for user ${userId}...`);
    
    // Validate userId
    if (!userId) {
      throw new PlaidError("User ID is required to create a link token");
    }
    
    const createTokenResponse = await client.linkTokenCreate({
      user: {
        client_user_id: userId, // Use the actual user's ID
      },
      products: ['auth', 'transactions'] as Products[],
      client_name: 'FlexiBill',
      country_codes: ['US'] as CountryCode[],
      language: 'en',
      // Use environment variable for webhook URL
      webhook: PLAID_WEBHOOK_URL,
      account_filters: {
        depository: {
          account_subtypes: [
            DepositoryAccountSubtype.Checking,
            DepositoryAccountSubtype.Savings
          ],
        },
      },
    });
    
    if (!createTokenResponse.data || !createTokenResponse.data.link_token) {
      throw new PlaidError("Failed to create link token: Invalid response from Plaid");
    }
    
    console.log('Plaid Link token created successfully');
    return createTokenResponse.data.link_token;
  } catch (error) {
    console.error('Error creating Plaid Link token:', error);
    throw error; // Re-throw instead of returning null
  }
}

export async function exchangePublicToken(publicToken: string, metadata: any, userId: string) {
  try {
    console.log(`Exchanging Plaid public token for user ${userId}...`);
    
    // Validate inputs
    if (!publicToken) {
      throw new PlaidError("Public token is required");
    }
    
    if (!userId) {
      throw new PlaidError("User ID is required");
    }
    
    const tokenResponse = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });
    
    if (!tokenResponse.data || !tokenResponse.data.access_token) {
      throw new PlaidError("Failed to exchange public token: Invalid response from Plaid");
    }
    
    const accessToken = tokenResponse.data.access_token;
    const itemID = tokenResponse.data.item_id;
    
    // Store the tokens in the database
    const db = DatabaseService.getInstance();
    
    // First, get the current user
    const { data: userData, error: userError } = await db.getClient()
      .from('users')
      .select('plaid_item_ids')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      throw new NotFoundError(`User not found: ${userId}`);
    }
    
    // Encrypt the access token before storing
    const encryptedAccessToken = encrypt(accessToken);
    
    // Store the Plaid item and access token information
    const { error: itemError } = await db.getClient().from('plaid_items').insert({
      item_id: itemID,
      user_id: userId,
      access_token: encryptedAccessToken,
      status: 'active',
      institution_id: metadata?.institution?.id || null,
      institution_name: metadata?.institution?.name || null
    });
    
    if (itemError) {
      throw new PlaidError(`Failed to store Plaid item: ${itemError.message}`);
    }
    
    // Update the user's plaid_item_ids array
    const updatedItemIds = [...(userData.plaid_item_ids || []), itemID];
    const { error: updateError } = await db.getClient()
      .from('users')
      .update({ plaid_item_ids: updatedItemIds })
      .eq('id', userId);
      
    if (updateError) {
      throw new PlaidError(`Failed to update user's Plaid items: ${updateError.message}`);
    }
    
    return { accessToken, itemID };
  } catch (error) {
    console.error('Error exchanging Plaid public token:', error);
    throw error; // Re-throw instead of returning null
  }
}

export async function getItem(itemId: string) {
  try {
    // Get the encrypted access token from the database
    const db = DatabaseService.getInstance();
    const { data, error } = await db.getClient()
      .from('plaid_items')
      .select('access_token')
      .eq('item_id', itemId)
      .single();
      
    if (error || !data) {
      throw new NotFoundError(`Failed to retrieve access token for item ${itemId}`);
    }
    
    // Decrypt the access token
    const accessToken = decrypt(data.access_token);
    
    const request: ItemGetRequest = {
      access_token: accessToken,
    };
    const response = await client.itemGet(request);
    console.log('Plaid Item details:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching Plaid Item details:', error);
    throw error;
  }
}

export async function getAccounts(itemId: string) {
  try {
    // Get the encrypted access token from the database
    const db = DatabaseService.getInstance();
    const { data, error } = await db.getClient()
      .from('plaid_items')
      .select('access_token')
      .eq('item_id', itemId)
      .single();
      
    if (error || !data) {
      throw new NotFoundError(`Failed to retrieve access token for item ${itemId}`);
    }
    
    // Decrypt the access token
    const accessToken = decrypt(data.access_token);
    
    const accountsResponse = await client.accountsGet({
      access_token: accessToken,
    });
    console.log('Plaid Accounts details:', accountsResponse.data);
    return accountsResponse.data.accounts;
  } catch (error) {
    console.error('Error fetching Plaid Accounts details:', error);
    throw error;
  }
}

export async function getTransactions(itemId: string, startDate: string, endDate: string) {
  try {
    // Get the encrypted access token from the database
    const db = DatabaseService.getInstance();
    const { data, error } = await db.getClient()
      .from('plaid_items')
      .select('access_token')
      .eq('item_id', itemId)
      .single();
      
    if (error || !data) {
      throw new NotFoundError(`Failed to retrieve access token for item ${itemId}`);
    }
    
    // Decrypt the access token
    const accessToken = decrypt(data.access_token);
    
    const request: TransactionsGetRequest = {
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: {
        count: 200,
        offset: 0,
      },
    };
    
    const transactionResponse = await client.transactionsGet(request);
    console.log('Plaid Transactions details:', transactionResponse.data);
    return transactionResponse.data.transactions;
  } catch (error) {
    console.error('Error fetching Plaid Transactions details:', error);
    throw error;
  }
}

// Get all accounts for a user across all their plaid items
export async function getUserAccounts(userId: string) {
  try {
    const db = DatabaseService.getInstance();
    // Get all plaid items for the user
    const { data: plaidItems, error } = await db.getClient()
      .from('plaid_items')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');
      
    if (error) {
      throw new PlaidError(`Failed to retrieve plaid items for user ${userId}`);
    }
    
    if (!plaidItems || plaidItems.length === 0) {
      return [];
    }
    
    // Collect all accounts from all items
    const allAccounts = [];
    for (const item of plaidItems) {
      const itemAccounts = await getAccounts(item.item_id);
      if (itemAccounts) {
        allAccounts.push(...itemAccounts);
      }
    }
    
    return allAccounts;
  } catch (error) {
    console.error(`Error fetching accounts for user ${userId}:`, error);
    throw error;
  }
}
