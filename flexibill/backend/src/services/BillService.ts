import { SupabaseClient } from '@supabase/supabase-js';

export interface Bill {
  id?: string;
  userId: string;
  name: string;
  amount: number;
  dueDate: string;
  category?: string;
  frequency: string;
  autopay: boolean;
}

export interface DateChangeRequest {
  billId: string;
  userId: string;
  currentDueDate: string;
  requestedDueDate: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

export class BillService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getBills(userId: string): Promise<Bill[]> {
    const { data, error } = await this.supabase
      .from('bills')
      .select('*')
      .eq('userId', userId);

    if (error) {
      throw error;
    }

    return data || [];
  }

  async addBill(bill: Bill): Promise<Bill> {
    const { data, error } = await this.supabase
      .from('bills')
      .insert(bill)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async updateBill(id: string, bill: Partial<Bill>): Promise<Bill> {
    const { data, error } = await this.supabase
      .from('bills')
      .update(bill)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async deleteBill(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('bills')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  async requestDateChange(request: DateChangeRequest): Promise<DateChangeRequest> {
    // In a real implementation, this would:
    // 1. Store the request in a database
    // 2. Trigger an email or API call to the biller
    // 3. Update the bill's due date once approved
    
    // For Phase 1, we'll simulate the process by:
    // 1. Storing the request
    // 2. Generating an email template (returned to the client)
    // 3. Updating the bill's due date after a delay (simulating approval)
    
    // Store the request (in a real implementation)
    // const { data, error } = await this.supabase
    //   .from('date_change_requests')
    //   .insert(request)
    //   .select()
    //   .single();
    
    // if (error) {
    //   throw error;
    // }
    
    // For demo purposes, automatically update the bill after a delay
    setTimeout(async () => {
      try {
        await this.updateBill(request.billId, {
          dueDate: request.requestedDueDate
        });
        console.log(`Due date changed for bill ${request.billId}`);
      } catch (error) {
        console.error('Error updating bill due date:', error);
      }
    }, 5000); // 5 seconds delay to simulate processing
    
    // Return the request with a pending status
    return {
      ...request,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
  }
  
  generateEmailTemplate(request: DateChangeRequest, bill: Bill): string {
    // Generate an email template that the user could send to their biller
    return `
Subject: Request to Change Due Date for Account #[Your Account Number]

Dear [Biller Name],

I am writing to request a change to my monthly payment due date for my account.

Current Details:
- Account Number: [Your Account Number]
- Current Due Date: ${request.currentDueDate}
- Payment Amount: $${bill.amount}

I would like to request that my new due date be changed to the ${new Date(request.requestedDueDate).getDate()}th of each month.

This change would help me better manage my monthly cash flow and ensure timely payments.

Please let me know if you need any additional information to process this request.

Thank you for your assistance.

Sincerely,
[Your Name]
[Your Contact Information]
    `;
  }
}