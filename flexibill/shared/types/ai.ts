export interface BillRecommendation {
  id: string;
  userId: string;
  billId: string;
  currentDueDate: string;
  recommendedDueDate: string;
  reason: string;
  savingsEstimate: number;
  confidenceScore: number;
  status: 'pending' | 'accepted' | 'rejected' | 'implemented';
  created_at: Date;
  updated_at: Date;
}

export interface CashFlowAnalysis {
  id: string;
  userId: string;
  period: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  incomeDays: string[];
  highExpenseDays: string[];
  lowBalanceDays: string[];
  projectedBalances: {
    date: string;
    balance: number;
  }[];
  recommendations: {
    type: 'move_bill' | 'reduce_expense' | 'save' | 'other';
    description: string;
    impact: number;
  }[];
  created_at: Date;
}