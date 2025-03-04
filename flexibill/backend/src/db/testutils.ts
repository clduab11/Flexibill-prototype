import { db } from './DatabaseService';
import { User, Account, Bill, BillRecommendation } from '../entities';
import { DeepPartial } from 'typeorm';

export async function setupTestDb() {
  await db.initialize();
  await db.clear();
}

export async function teardownTestDb() {
  await db.destroy();
}

export const createTestUser = async (data: Partial<User> = {}): Promise<User> => {
  const user = User.create({
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    firstName: 'Test',
    lastName: 'User',
    subscription: 'free',
    subscriptionStatus: 'active',
    ...data
  });
  return await db.getRepository(User).save(user);
};

export const createTestAccount = async (user: User, data: Partial<Account> = {}): Promise<Account> => {
  const account = Account.create({
    userId: user.id,
    plaidAccountId: 'test_plaid_account_id',
    plaidItemId: 'test_plaid_item_id',
    name: 'Test Account',
    type: 'checking',
    balanceCurrent: 1000,
    currency: 'USD',
    status: 'active',
    ...data
  });
  return await db.getRepository(Account).save(account);
};

export const createTestBill = async (user: User, data: Partial<Bill> = {}): Promise<Bill> => {
  const bill = Bill.create({
    userId: user.id,
    name: 'Test Bill',
    amount: 50,
    dueDate: new Date('2025-03-15'),
    frequency: 'monthly',
    category: 'Utilities',
    autopay: false,
    reminderDays: [3, 7],
    status: 'active',
    ...data
  });
  return await db.getRepository(Bill).save(bill);
};

export const createTestBillRecommendation = async (
  user: User,
  bill: Bill,
  data: Partial<BillRecommendation> = {}
): Promise<BillRecommendation> => {
  const recommendation = BillRecommendation.create({
    userId: user.id,
    billId: bill.id,
    type: 'due_date',
    currentDueDate: new Date('2025-03-15'),
    recommendedDueDate: new Date('2025-03-20'),
    reason: 'Test recommendation',
    confidenceScore: 0.9,
    status: 'pending',
    ...data
  });
  return await db.getRepository(BillRecommendation).save(recommendation);
};