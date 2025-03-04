import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Check,
  Index
} from 'typeorm';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

export type AccountType = 'checking' | 'savings' | 'credit' | 'loan' | 'investment' | 'other';
export type AccountSubtype = 'personal' | 'business' | 'mortgage' | 'student_loan' | 'credit_card' | 'other';
export type AccountStatus = 'active' | 'inactive' | 'pending' | 'error';

export interface AccountData {
  id: string;
  userId: string;
  plaidAccountId: string;
  plaidItemId: string;
  plaidAccessToken: string;
  plaidRefreshToken?: string;
  name: string;
  officialName?: string;
  type: AccountType;
  subtype?: AccountSubtype;
  mask?: string;
  balanceCurrent: number;
  balanceAvailable?: number;
  balanceLimit?: number;
  currency: string;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

@Entity('accounts')
@Index(['userId', 'plaidAccountId'], { unique: true })
@Check(`"balance_current" >= -1000000`) // Allow reasonable overdraft
export class Account implements AccountData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'plaid_account_id', length: 255 })
  @Index()
  plaidAccountId!: string;

  @Column({ name: 'plaid_item_id', length: 255 })
  @Index()
  plaidItemId!: string;

  @Column({ name: 'plaid_access_token', length: 255 })
  plaidAccessToken!: string;

  @Column({
    name: 'plaid_refresh_token',
    length: 255,
    nullable: true
  })
  plaidRefreshToken?: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: 'official_name', length: 255, nullable: true })
  officialName?: string;

  @Column({
    type: 'enum',
    enum: ['checking', 'savings', 'credit', 'loan', 'investment', 'other'] as AccountType[]
  })
  type!: AccountType;

  @Column({
    type: 'enum',
    enum: ['personal', 'business', 'mortgage', 'student_loan', 'credit_card', 'other'] as AccountSubtype[],
    nullable: true
  })
  subtype?: AccountSubtype;

  @Column({ length: 4, nullable: true })
  mask?: string;

  @Column({
    name: 'balance_current',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0
  })
  balanceCurrent!: number;

  @Column({
    name: 'balance_available',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true
  })
  balanceAvailable?: number;

  @Column({
    name: 'balance_limit',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true
  })
  balanceLimit?: number;

  @Column({ length: 3, default: 'USD' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'pending', 'error'] as AccountStatus[],
    default: 'active'
  })
  status!: AccountStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions?: Transaction[];

  // Virtual getters
  get isOverdrawn(): boolean {
    return this.balanceCurrent < 0;
  }

  get hasAvailableBalance(): boolean {
    return this.balanceAvailable !== undefined && this.balanceAvailable > 0;
  }

  get availableCredit(): number | undefined {
    if (this.type === 'credit' && this.balanceLimit) {
      return this.balanceLimit - this.balanceCurrent;
    }
    return undefined;
  }

  get utilization(): number | undefined {
    if (this.type === 'credit' && this.balanceLimit && this.balanceLimit > 0) {
      return (this.balanceCurrent / this.balanceLimit) * 100;
    }
    return undefined;
  }

  // Helper methods
  canWithdraw(amount: number): boolean {
    if (amount <= 0) {
      return false;
    }

    if (this.type === 'credit') {
      return this.availableCredit ? this.availableCredit >= amount : false;
    }

    return this.balanceAvailable ? this.balanceAvailable >= amount : this.balanceCurrent >= amount;
  }

  isLowBalance(threshold: number = 100): boolean {
    return this.balanceAvailable ? this.balanceAvailable < threshold : this.balanceCurrent < threshold;
  }

  // Serialization
  toJSON(): AccountData {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user: _, ...accountData } = this;
    return accountData;
  }

  // Factory method
  static create(params: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>): Account {
    const account = new Account();
    Object.assign(account, params);
    return account;
  }
}