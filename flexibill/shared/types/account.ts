export interface Account {
  id: string;
  userId: string;
  plaidAccountId: string;
  plaidAccessToken: string;
  plaidItemId: string;
  institution: {
    id: string;
    name: string;
    logo?: string;
  };
  name: string;
  mask: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'other';
  subtype: string;
  balances: {
    available: number;
    current: number;
    limit?: number;
    isoCurrencyCode: string;
  };
  lastSyncedAt: Date;
  status: 'active' | 'disconnected' | 'error';
  errorCode?: string;
  created_at: Date;
  updated_at: Date;
}