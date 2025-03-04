import { 
  Transaction, 
  TransactionFilter, 
  TransactionSummary, 
  TransactionAnalysis,
  RecurringRule
} from '@shared/types';
import { Database } from '../db/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { randomUUID } from 'crypto';

type RecurringChangeType = 'new' | 'increased' | 'decreased' | 'stopped';
type MerchantSuggestionType = 'alternative' | 'bundle' | 'timing';

interface RecurringGroup {
  amount: number;
  date: string;
}

interface MerchantStats {
  totalSpent: number;
  frequency: number;
  transactions: Transaction[];
  categories: Set<string>;
}

class TransactionService {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  async getTransactions(userId: string, filter: TransactionFilter): Promise<Transaction[]> {
    const transactions = await this.db.transactions.findByUserId(userId);
    
    return transactions.filter(tx => {
      if (filter.startDate && new Date(tx.date) < new Date(filter.startDate)) return false;
      if (filter.endDate && new Date(tx.date) > new Date(filter.endDate)) return false;
      if (filter.minAmount && tx.amount < filter.minAmount) return false;
      if (filter.maxAmount && tx.amount > filter.maxAmount) return false;
      if (filter.categories?.length && !filter.categories.some(cat => tx.category.includes(cat))) return false;
      if (filter.excludeCategories?.length && filter.excludeCategories.some(cat => tx.category.includes(cat))) return false;
      if (filter.merchants?.length && !filter.merchants.includes(tx.merchantName || '')) return false;
      if (filter.excludeMerchants?.length && filter.excludeMerchants.includes(tx.merchantName || '')) return false;
      if (filter.tags?.length && !filter.tags.some(tag => tx.tags.includes(tag))) return false;
      if (filter.excludeTags?.length && filter.excludeTags.some(tag => tx.tags.includes(tag))) return false;
      if (filter.isRecurring !== undefined && tx.isRecurring !== filter.isRecurring) return false;
      if (filter.searchTerm && !this.matchesSearchTerm(tx, filter.searchTerm)) return false;
      if (filter.accountIds?.length && !filter.accountIds.includes(tx.accountId)) return false;
      if (filter.pending !== undefined && tx.pending !== filter.pending) return false;
      if (filter.paymentChannels?.length && !filter.paymentChannels.includes(tx.paymentChannel)) return false;
      
      return true;
    });
  }

  async updateTransactionTags(userId: string, transactionId: string, tags: string[]): Promise<Transaction> {
    const transactions = await this.db.transactions.findByUserId(userId);
    const transaction = transactions.find(tx => tx.id === transactionId);

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    if (transaction.userId !== userId) {
      throw new ValidationError('Unauthorized access to transaction');
    }

    const updatedTransaction: Transaction = {
      ...transaction,
      tags: [...new Set(tags)],
      updated_at: new Date()
    };

    await this.db.transactions.bulkUpdate([updatedTransaction]);
    return updatedTransaction;
  }

  async detectRecurringTransactions(userId: string): Promise<Transaction[]> {
    const transactions = await this.db.transactions.findByUserId(userId);
    const groups = this.groupSimilarTransactions(transactions);
    const recurringTransactions: Transaction[] = [];
    
    for (const group of groups) {
      if (this.isRecurringPattern(group)) {
        const updatedTransactions = group.map(tx => ({
          ...tx,
          isRecurring: true,
          updated_at: new Date()
        }));
        
        await this.db.transactions.bulkUpdate(updatedTransactions);
        recurringTransactions.push(...updatedTransactions);
      }
    }

    return recurringTransactions;
  }

  async categorizeTransactions(userId: string, transactions: Transaction[]): Promise<Transaction[]> {
    transactions.forEach(tx => {
      if (tx.userId !== userId) {
        throw new ValidationError('Unauthorized access to transaction');
      }
    });

    const categorizedTransactions = transactions.map(tx => ({
      ...tx,
      category: this.determineCategory(tx),
      updated_at: new Date()
    }));

    await this.db.transactions.bulkUpdate(categorizedTransactions);
    return categorizedTransactions;
  }

  private matchesSearchTerm(transaction: Transaction, searchTerm: string): boolean {
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.name.toLowerCase().includes(searchLower) ||
      transaction.merchantName?.toLowerCase().includes(searchLower) ||
      transaction.category.some(cat => cat.toLowerCase().includes(searchLower)) ||
      transaction.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  private groupSimilarTransactions(transactions: Transaction[]): Transaction[][] {
    const groups = new Map<string, Transaction[]>();

    transactions.forEach(tx => {
      const key = `${tx.name}-${tx.amount}-${tx.merchantName}`;
      const group = groups.get(key) || [];
      group.push(tx);
      groups.set(key, group);
    });

    return Array.from(groups.values());
  }

  private isRecurringPattern(transactions: Transaction[]): boolean {
    if (transactions.length < 3) return false;

    const sorted = transactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const interval = Math.floor(
        (new Date(sorted[i].date).getTime() - new Date(sorted[i-1].date).getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      intervals.push(interval);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return intervals.every(interval => Math.abs(interval - avgInterval) <= 3);
  }

  private determineCategory(transaction: Transaction): string[] {
    const name = transaction.name.toLowerCase();
    const categories: string[] = [];

    if (name.includes('uber') || name.includes('lyft')) {
      categories.push('Transportation');
    } else if (name.includes('market') || name.includes('grocery')) {
      categories.push('Groceries');
    } else if (name.includes('restaurant') || name.includes('cafe')) {
      categories.push('Dining');
    } else if (name.includes('netflix') || name.includes('spotify')) {
      categories.push('Entertainment');
      categories.push('Subscription');
    }

    return categories.length > 0 ? categories : ['Uncategorized'];
  }

  private groupRecurringTransactions(transactions: Transaction[]): Record<string, RecurringGroup> {
    const recurring: Record<string, RecurringGroup> = {};

    transactions
      .filter(tx => tx.isRecurring)
      .forEach(tx => {
        recurring[tx.name] = {
          amount: tx.amount,
          date: tx.date
        };
      });

    return recurring;
  }

  private detectRecurringChanges(
    currentTransactions: Transaction[],
    previousTransactions: Transaction[]
  ): {
    type: RecurringChangeType;
    name: string;
    oldAmount?: number;
    newAmount?: number;
    percentageChange?: number;
    lastDate?: string;
  }[] {
    const currentRecurring = this.groupRecurringTransactions(currentTransactions);
    const previousRecurring = this.groupRecurringTransactions(previousTransactions);
    const changes = [];

    for (const [name, current] of Object.entries(currentRecurring)) {
      const previous = previousRecurring[name];
      
      if (!previous) {
        changes.push({
          type: 'new' as RecurringChangeType,
          name,
          newAmount: current.amount,
          lastDate: current.date
        });
      } else if (Math.abs(current.amount - previous.amount) > 1) {
        changes.push({
          type: (current.amount > previous.amount ? 'increased' : 'decreased') as RecurringChangeType,
          name,
          oldAmount: previous.amount,
          newAmount: current.amount,
          percentageChange: ((current.amount - previous.amount) / previous.amount) * 100,
          lastDate: current.date
        });
      }
    }

    for (const [name, previous] of Object.entries(previousRecurring)) {
      if (!currentRecurring[name]) {
        changes.push({
          type: 'stopped' as RecurringChangeType,
          name,
          oldAmount: previous.amount,
          lastDate: previous.date
        });
      }
    }

    return changes;
  }
}

export default TransactionService;