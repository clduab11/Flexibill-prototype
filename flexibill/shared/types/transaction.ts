export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  plaidTransactionId?: string;
  amount: number;
  date: string;
  name: string;
  merchantName?: string;
  category: string[];
  categoryId?: string;
  pending: boolean;
  paymentChannel: 'online' | 'in store' | 'other';
  isRecurring: boolean;
  recurringRuleId?: string;
  tags: string[];
  location?: {
    address?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    lat?: number;
    lon?: number;
  };
  created_at: Date;
  updated_at: Date;
}

export interface RecurringRule {
  id: string;
  userId: string;
  name: string;
  merchantName?: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  amount: {
    min: number;
    max: number;
    typical: number;
  };
  dayOfMonth?: number;
  dayOfWeek?: number;
  detectPattern: {
    namePattern: string;
    merchantPattern?: string;
    amountVariance: number;
    dateVariance: number;
  };
  lastOccurrence?: string;
  nextExpectedDate?: string;
  confidence: number;
  status: 'active' | 'inactive' | 'deleted';
  created_at: Date;
  updated_at: Date;
}

export interface TransactionCategory {
  id: string;
  name: string;
  parent?: string;
  icon?: string;
  color?: string;
  rules?: {
    namePatterns: string[];
    merchantPatterns: string[];
    excludePatterns: string[];
  };
}

export interface TransactionSummary {
  totalAmount: number;
  count: number;
  categories: {
    [category: string]: {
      amount: number;
      count: number;
      percentage: number;
    };
  };
  merchants: {
    [merchant: string]: {
      amount: number;
      count: number;
      percentage: number;
    };
  };
  tags: {
    [tag: string]: {
      amount: number;
      count: number;
      percentage: number;
    };
  };
  recurringTotal: number;
  recurringCount: number;
  averageTransaction: number;
  largestTransaction: {
    amount: number;
    name: string;
    date: string;
  };
  periodComparison?: {
    previousPeriod: {
      totalAmount: number;
      count: number;
    };
    percentageChange: {
      amount: number;
      count: number;
    };
  };
}

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  categories?: string[];
  merchants?: string[];
  tags?: string[];
  isRecurring?: boolean;
  searchTerm?: string;
  accountIds?: string[];
  excludeCategories?: string[];
  excludeMerchants?: string[];
  excludeTags?: string[];
  pending?: boolean;
  paymentChannels?: ('online' | 'in store' | 'other')[];
}

export interface TransactionAnalysis {
  unusualSpending: {
    category: string;
    currentAmount: number;
    typicalAmount: number;
    percentageIncrease: number;
    transactions: Transaction[];
  }[];
  recurringChanges: {
    type: 'new' | 'increased' | 'decreased' | 'stopped';
    name: string;
    oldAmount?: number;
    newAmount?: number;
    percentageChange?: number;
    lastDate?: string;
  }[];
  spendingTrends: {
    period: string;
    categories: {
      [category: string]: number;
    };
    total: number;
  }[];
  merchantInsights: {
    name: string;
    totalSpent: number;
    frequency: number;
    averageTransaction: number;
    categories: string[];
    suggestions?: {
      type: 'alternative' | 'bundle' | 'timing';
      description: string;
      potentialSavings: number;
    }[];
  }[];
}