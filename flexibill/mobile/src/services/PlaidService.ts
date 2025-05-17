import ApiService from './ApiService';

export interface PlaidLinkToken {
  linkToken: string;
}

interface ExchangeTokenResponse {
  success: boolean;
}

// Define a simplified version of the metadata structure
export interface PlaidLinkMetadata {
  institution?: {
    id: string;
    name: string;
  };
  accounts?: Array<{
    id: string;
    name: string;
    mask: string;
    type: string;
    subtype: string;
  }>;
  linkSessionId?: string;
  [key: string]: any;
}

class PlaidService {
  static async createLinkToken(): Promise<PlaidLinkToken | null> {
    console.log('Creating Plaid Link token...');
    try {
      const response = await ApiService.get<PlaidLinkToken>('/plaid/create-link-token');
      console.log('Plaid Link token created:', response.data);
      return response.data || null;
    } catch (error) {
      console.error('Error creating link token:', error);
      return null;
    }
  }

  static async exchangePublicToken(
    publicToken: string, 
    metadata: PlaidLinkMetadata
  ): Promise<boolean> {
    console.log('Exchanging Plaid public token...', publicToken, metadata);
    try {
      const response = await ApiService.post<ExchangeTokenResponse>('/plaid/exchange-public-token', {
        publicToken,
        metadata: {
          institution: metadata.institution,
          accounts: metadata.accounts,
          link_session_id: metadata.linkSessionId
        }
      });
      console.log('Plaid public token exchange result:', response.data);
      return response.data?.success === true;
    } catch (error) {
      console.error('Error exchanging public token:', error);
      throw error;
    }
  }

  // Simulate a successful Plaid link for development purposes
  static async simulateSuccessfulLink(): Promise<boolean> {
    console.log('Simulating successful Plaid link...');
    // Simulate a delay to mimic network request
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  static async getInstitutions(): Promise<any> {
    console.log('Fetching institutions...');
    try {
      const response = await ApiService.get('/plaid/institutions');
      console.log('Institutions fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching institutions:', error);
      throw error;
    }
  }

  static async filterAccounts(accounts: any[], filter: (account: any) => boolean): Promise<any[]> {
    console.log('Filtering accounts...');
    return accounts.filter(filter);
  }

  static async handleMultiFactorAuthentication(publicToken: string, metadata: PlaidLinkMetadata): Promise<boolean> {
    console.log('Handling multi-factor authentication...');
    try {
      const response = await ApiService.post<ExchangeTokenResponse>('/plaid/mfa', {
        publicToken,
        metadata: {
          institution: metadata.institution,
          accounts: metadata.accounts,
          link_session_id: metadata.linkSessionId
        }
      });
      console.log('MFA result:', response.data);
      return response.data?.success === true;
    } catch (error) {
      console.error('Error handling MFA:', error);
      throw error;
    }
  }
}

export default PlaidService;
