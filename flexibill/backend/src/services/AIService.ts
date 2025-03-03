import { SupabaseClient } from '@supabase/supabase-js';
import { Bill, BillRecommendation } from '../../../shared/types';
import { Transaction } from '../../../shared/types';
import { CashFlowAnalysis } from './types';

export class AIService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async analyzeBills(userId: string): Promise<BillRecommendation[]> {
    // In a real implementation, this would:
    // 1. Fetch the user's bills and transactions
    // 2. Use AI to analyze payment patterns and cash flow
    // 3. Generate recommendations for bill due date changes

    // For Phase 2, return mock recommendations
    const { data: bills, error } = await this.supabase
      .from('bills')
      .select('*')
      .eq('userId', userId);

    if (error) {
      throw error;
    }

    // Generate simple recommendations based on bill due dates
    const recommendations: BillRecommendation[] = [];
    
    if (bills && bills.length > 0) {
      // Find bills that are due close to each other
      const sortedBills = [...bills].sort((a, b) => 
        new Date(a.dueDate).getDate() - new Date(b.dueDate).getDate()
      );
      
      for (let i = 0; i < sortedBills.length - 1; i++) {
        const currentBill = sortedBills[i];
        const nextBill = sortedBills[i + 1];
        
        const currentDate = new Date(currentBill.dueDate).getDate();
        const nextDate = new Date(nextBill.dueDate).getDate();
        
        // If bills are due within 2 days of each other, recommend spreading them out
        if (Math.abs(currentDate - nextDate) <= 2) {
          const newDueDate = new Date(nextBill.dueDate);
          newDueDate.setDate(currentDate + 7); // Move it 7 days later
          
          recommendations.push({
            billId: nextBill.id,
            currentDueDate: nextBill.dueDate,
            recommendedDueDate: newDueDate.toISOString(),
            reason: `This bill is due very close to your ${currentBill.name} payment. Spreading them out can help manage cash flow.`,
            savingsEstimate: 0 // No direct savings, but helps with cash flow
          });
        }
      }
    }

    return recommendations;
  }

  async getCashFlowAnalysis(userId: string): Promise<CashFlowAnalysis> {
    // In a real implementation, this would:
    // 1. Fetch the user's transactions
    // 2. Analyze income and expense patterns
    // 3. Identify potential cash flow issues

    // For Phase 2, return mock analysis
    return {
      period: 'monthly',
      incomeDays: ['1st', '15th'],
      highExpenseDays: ['5th', '20th'],
      lowBalanceDays: ['10th-14th', '25th-30th'],
      recommendations: [
        'Consider moving your utility bill from the 12th to the 17th to better align with your income',
        'Your rent payment on the 1st is close to your income day, but you might want a buffer of 1-2 days',
        'Try to schedule automatic savings transfers on income days to ensure consistent saving'
      ]
    };
  }

  async getPremiumInsights(userId: string): Promise<string[]> {
    // This would be a premium feature, providing more detailed insights
    // For Phase 2, just return a message that this is a premium feature
    return [
      'Premium AI insights are not available in your current plan.',
      'Upgrade to Premium to access detailed cash flow predictions, personalized savings strategies, and more.'
    ];
  }
}