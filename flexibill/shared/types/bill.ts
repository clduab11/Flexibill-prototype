export interface Bill {
  id?: string;
  userId: string;
  name: string;
  amount: number;
  dueDate: string;
  category?: string;
  frequency: 'monthly' | 'weekly' | 'yearly';
  autopay: boolean;
}

export interface DateChangeRequest {
  id?: string;
  billId: string;
  userId: string;
  currentDueDate: string;
  requestedDueDate: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

export interface BillRecommendation {
  billId: string;
  currentDueDate: string;
  recommendedDueDate: string;
  reason: string;
  savingsEstimate?: number;
}