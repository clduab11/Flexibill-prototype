import { User } from './user.entity';
import { Account } from './account.entity';
import { Bill } from './bill.entity';
import { BillRecommendation } from './bill-recommendation.entity';
import { Transaction } from './transaction.entity';

// Re-export everything from entity files
export * from './user.entity';
export * from './account.entity';
export * from './bill.entity';
export * from './bill-recommendation.entity';
export * from './transaction.entity';

// Entity Classes
export { User } from './user.entity';
export { Account } from './account.entity';
export { Bill } from './bill.entity';
export { BillRecommendation } from './bill-recommendation.entity';
export { Transaction } from './transaction.entity';

// Entity Type Union
export type EntityType = User | Account | Bill | BillRecommendation | Transaction;

// Factory functions with proper types
export const createUser = (params: Parameters<typeof User.create>[0]): User => {
  return User.create(params);
};

export const createAccount = (params: Parameters<typeof Account.create>[0]): Account => {
  return Account.create(params);
};

export const createBill = (params: Parameters<typeof Bill.create>[0]): Bill => {
  return Bill.create(params);
};

export const createBillRecommendation = (
  params: Parameters<typeof BillRecommendation.create>[0]
): BillRecommendation => {
  return BillRecommendation.create(params);
};

export const createTransaction = (params: Parameters<typeof Transaction.create>[0]): Transaction => {
  return Transaction.create(params);
};

// Type guard functions
export const isUser = (entity: unknown): entity is User => {
  return entity instanceof User;
};

export const isAccount = (entity: unknown): entity is Account => {
  return entity instanceof Account;
};

export const isBill = (entity: unknown): entity is Bill => {
  return entity instanceof Bill;
};

export const isBillRecommendation = (entity: unknown): entity is BillRecommendation => {
  return entity instanceof BillRecommendation;
};

export const isTransaction = (entity: unknown): entity is Transaction => {
  return entity instanceof Transaction;
};

// Helper function to ensure entity type safety
export function assertEntityType<T extends EntityType>(
  entity: unknown,
  check: (e: unknown) => e is T
): asserts entity is T {
  if (!check(entity)) {
    throw new Error(`Invalid entity type: ${entity}`);
  }
}

// Helper types for repository operations
export type EntityMap = {
  user: User;
  account: Account;
  bill: Bill;
  billRecommendation: BillRecommendation;
  transaction: Transaction;
};

export type EntityName = keyof EntityMap;

export type EntityClass<T extends EntityName> = {
  new (): EntityMap[T];
  create: (...args: any[]) => EntityMap[T];
};

// Helper function to get entity class
export function getEntityClass<T extends EntityName>(entityName: T): EntityClass<T> {
  const entityClasses: Record<EntityName, EntityClass<EntityName>> = {
    user: User,
    account: Account,
    bill: Bill,
    billRecommendation: BillRecommendation,
    transaction: Transaction
  };
  return entityClasses[entityName] as EntityClass<T>;
}