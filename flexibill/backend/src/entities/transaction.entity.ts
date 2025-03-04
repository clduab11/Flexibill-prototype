import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from './user.entity';
import { Account } from './account.entity';

export type PaymentChannel = 'online' | 'in store' | 'other';

export interface TransactionLocation {
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  lat?: number;
  lon?: number;
}

export interface TransactionData {
  id: string;
  user_id: string;
  account_id: string;
  plaidTransactionId: string;
  amount: number;
  date: string;
  name: string;
  merchantName?: string;
  category: string[];
  categoryId: string;
  pending: boolean;
  paymentChannel: PaymentChannel;
  isRecurring: boolean;
  tags: string[];
  location?: TransactionLocation;
  created_at: Date;
  updated_at: Date;
}

@Entity('transactions')
@Index(['user_id', 'date'])
@Index(['account_id', 'date'])
@Index(['plaidTransactionId'], { unique: true })
export class Transaction implements TransactionData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  @Index()
  user_id!: string;

  @Column({ name: 'account_id' })
  @Index()
  account_id!: string;

  @Column({ name: 'plaid_transaction_id', unique: true })
  plaidTransactionId!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  @Index()
  date!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: 'merchant_name', length: 255, nullable: true })
  merchantName?: string;

  @Column('text', { array: true, default: [] })
  category!: string[];

  @Column({ name: 'category_id', length: 100, default: '' })
  categoryId!: string;

  @Column({ default: false })
  pending!: boolean;

  @Column({
    name: 'payment_channel',
    type: 'enum',
    enum: ['online', 'in store', 'other'],
    default: 'other'
  })
  paymentChannel!: PaymentChannel;

  @Column({ name: 'is_recurring', default: false })
  isRecurring!: boolean;

  @Column('text', { array: true, default: [] })
  tags!: string[];

  @Column('jsonb', { nullable: true })
  location?: TransactionLocation;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at!: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Account, (account) => account.transactions)
  @JoinColumn({ name: 'account_id' })
  account?: Account;

  // Factory method
  static create(params: Partial<Omit<Transaction, 'id' | 'created_at' | 'updated_at'>>): Transaction {
    const transaction = new Transaction();
    Object.assign(transaction, params);
    return transaction;
  }
}