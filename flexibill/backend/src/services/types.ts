export interface CashFlowAnalysis {
  period: 'weekly' | 'monthly';
  incomeDays: string[];
  highExpenseDays: string[];
  lowBalanceDays: string[];
  recommendations: string[];
}