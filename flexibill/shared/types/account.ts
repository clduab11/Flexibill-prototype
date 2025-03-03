export interface Account {
  id: string;
  userId: string;
  plaidAccessToken: string;
  institution: string;
  mask: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'other';
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  date: string;
  category: string;
  name: string;
  pending: boolean;
  metadata?: Record<string, any>;
}

export interface PlaidLinkResponse {
  publicToken: string;
  metadata: {
    institution: {
      id: string;
      name: string;
    };
    accounts: Array<{
      id: string;
      name: string;
      mask: string;
      type: string;
      subtype: string;
    }>;
  };
}