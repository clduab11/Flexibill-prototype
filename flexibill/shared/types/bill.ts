export type BillFrequency = 'once' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Bill {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dueDate: string;
  frequency: BillFrequency;
  category?: string;
  autopay: boolean;
  reminderDays: number[];
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BillReminder {
  id: string;
  billId: string;
  userId: string;
  daysBeforeDue: number;
  sent: boolean;
  sentAt?: Date;
  created_at: Date;
}

export type BillRecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'implemented';

export interface BillRecommendation {
  id: string;
  userId: string;
  billId: string;
  currentDueDate: string;
  recommendedDueDate: string;
  reason: string;
  savingsEstimate: number;
  confidenceScore: number;
  status: BillRecommendationStatus;
  created_at: Date;
  updated_at: Date;
}