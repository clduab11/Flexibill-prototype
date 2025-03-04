import { randomUUID } from 'crypto';
import { Bill, Transaction, BillRecommendation, BillFrequency } from '@shared/types';
import { Database } from '../db/database';
import AIService from './AIService';
import { NotFoundError, ValidationError } from '../utils/errors';

interface CreateBillData {
  name: string;
  amount: number;
  dueDate: string;
  frequency: BillFrequency;
  category?: string;
  autopay: boolean;
  reminderDays: number[];
  notes?: string;
}

class BillService {
  private db: Database;
  private aiService: AIService;

  constructor() {
    this.db = new Database();
    this.aiService = new AIService();
  }

  async createBill(userId: string, billData: CreateBillData): Promise<Bill> {
    try {
      const bill: Bill = {
        id: randomUUID(),
        userId,
        ...billData,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Validate bill data
      this.validateBill(bill);

      // Save to database
      return await this.db.bills.create(bill);
    } catch (error) {
      console.error('Error creating bill:', error);
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error('Failed to create bill');
    }
  }

  async getBill(userId: string, billId: string): Promise<Bill> {
    const bill = await this.db.bills.findById(billId);
    
    if (!bill) {
      throw new NotFoundError('Bill not found');
    }

    if (bill.userId !== userId) {
      throw new ValidationError('Unauthorized access to bill');
    }

    return bill;
  }

  async updateBill(
    userId: string, 
    billId: string, 
    updates: Partial<CreateBillData>
  ): Promise<Bill> {
    const existingBill = await this.getBill(userId, billId);

    const updatedBill: Bill = {
      ...existingBill,
      ...updates,
      updated_at: new Date()
    };

    // Validate updated bill data
    this.validateBill(updatedBill);

    // Save to database
    return await this.db.bills.update(billId, updatedBill);
  }

  async deleteBill(userId: string, billId: string): Promise<void> {
    await this.getBill(userId, billId); // Check existence and ownership
    await this.db.bills.delete(billId);
  }

  async getUserBills(userId: string): Promise<Bill[]> {
    return await this.db.bills.findByUserId(userId);
  }

  async optimizeBillSchedule(userId: string): Promise<void> {
    // Get user's bills and transactions
    const [bills, transactions] = await Promise.all([
      this.getUserBills(userId),
      this.db.transactions.findByUserId(userId)
    ]);

    // Get AI recommendations
    const recommendations = await this.aiService.generateBillRecommendations(bills, transactions);

    // Update bills with new due dates based on recommendations
    await Promise.all(
      recommendations.map(async (rec) => {
        if (rec.status === 'accepted') {
          await this.updateBill(userId, rec.billId, {
            dueDate: rec.recommendedDueDate
          });
        }
      })
    );
  }

  private validateBill(bill: Bill): void {
    if (!bill.name || bill.name.trim().length === 0) {
      throw new ValidationError('Bill name is required');
    }

    if (bill.amount <= 0) {
      throw new ValidationError('Bill amount must be greater than 0');
    }

    if (!bill.dueDate) {
      throw new ValidationError('Due date is required');
    }

    const validFrequencies: BillFrequency[] = ['once', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
    if (!validFrequencies.includes(bill.frequency)) {
      throw new ValidationError('Invalid bill frequency');
    }

    if (bill.reminderDays) {
      if (!Array.isArray(bill.reminderDays)) {
        throw new ValidationError('Reminder days must be an array');
      }

      if (bill.reminderDays.some(days => !Number.isInteger(days) || days < 1 || days > 30)) {
        throw new ValidationError('Reminder days must be integers between 1 and 30');
      }
    }
  }

  async getBillsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Bill[]> {
    return await this.db.bills.findByDateRange(userId, startDate, endDate);
  }

  async getBillsForMonth(userId: string, year: number, month: number): Promise<Bill[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return await this.getBillsByDateRange(userId, startDate, endDate);
  }

  async getUpcomingBills(userId: string, days: number = 7): Promise<Bill[]> {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
    return await this.getBillsByDateRange(userId, startDate, endDate);
  }

  async getOverdueBills(userId: string): Promise<Bill[]> {
    const today = new Date();
    const bills = await this.getUserBills(userId);
    return bills.filter(bill => new Date(bill.dueDate) < today);
  }
}

export default BillService;