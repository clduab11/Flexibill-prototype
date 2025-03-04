import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { ItemGetRequest } from 'plaid';

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV as PlaidEnvironments || PlaidEnvironments.Sandbox;

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  secret: PLAID_SECRET,
  clientId: PLAID_CLIENT_ID,
});

const client = new PlaidApi(configuration);

export async function createLinkToken() {
  try {
    console.log('Creating Plaid Link token...');
    const createTokenResponse = await client.linkTokenCreate({
      user: {
        client_user_id: 'user-id',
      },
      products: ['auth', 'transactions'],
      client_name: 'FlexiBill',
      country_codes: ['US'],
      language: 'en',
      webhook: 'https://webhook.site/43e7a7b8-9bb4-4891-8695-25f54974f944',
      account_filters: [
        {
          depository: {
            account_subtypes: ['checking', 'savings'],
          },
        },
      ],
    });
    console.log('Plaid Link token created:', createTokenResponse.data);
    return createTokenResponse.data.link_token;
  } catch (error) {
    console.error('Error creating Plaid Link token:', error);
    return null;
  }
}

export async function exchangePublicToken(publicToken: string, metadata: any) {
  try {
    console.log('Exchanging Plaid public token...', publicToken, metadata);
    const tokenResponse = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });
    console.log('Plaid public token exchange result:', tokenResponse.data);
    const accessToken = tokenResponse.data.access_token;
    const itemID = tokenResponse.data.item_id;
    console.log(`Access Token: ${accessToken}`);
    console.log(`Item ID: ${itemID}`);
    return { accessToken, itemID };
  } catch (error) {
    console.error('Error exchanging Plaid public token:', error);
    return null;
  }
}

export async function getItem(accessToken: string) {
  try {
    const request: ItemGetRequest = {
      access_token: accessToken,
    };
    const response = await client.itemGet(request);
    console.log('Plaid Item details:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching Plaid Item details:', error);
    return null;
  }
}

export async function getAccounts(accessToken: string) {
  try {
    const accountsResponse = await client.accountsGet({
      access_token: accessToken,
    });
    console.log('Plaid Accounts details:', accountsResponse.data);
    return accountsResponse.data.accounts;
  } catch (error) {
    console.error('Error fetching Plaid Accounts details:', error);
    return null;
  }
}

export async function getTransactions(accessToken: string, startDate: string, endDate: string) {
  try {
    const transactionResponse = await client.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      count: 200,
      offset: 0,
    });
    console.log('Plaid Transactions details:', transactionResponse.data);
    return transactionResponse.data.transactions;
  } catch (error) {
    console.error('Error fetching Plaid Transactions details:', error);
    return null;
  }
}
