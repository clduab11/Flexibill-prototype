import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  Index
} from 'typeorm';
import { Account } from './account.entity';
import { Bill } from './bill.entity';
import { BillRecommendation } from './bill-recommendation.entity';
import { Transaction } from './transaction.entity';

export type Subscription = 'free' | 'essential' | 'premium' | 'data_partner';
export type SubscriptionStatus = 'active' | 'inactive' | 'pending' | 'cancelled';
export type Feature = 'ai_recommendations' | 'bill_optimization' | 'advanced_analytics' | 'basic';

export interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscription: Subscription;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPricing?: {
    basePrice: number;
    currentPrice: number;
    discountPercentage: number;
  };
  plaidItemIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Entity('users')
@Index(['email'], { unique: true })
export class User implements UserData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  @Index()
  email!: string;

  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash!: string;

  @Column({ name: 'first_name', length: 100, nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName?: string;

  @Column({
    type: 'enum',
    enum: ['free', 'essential', 'premium', 'data_partner'] as Subscription[],
    default: 'free'
  })
  subscription!: Subscription;

  @Column('jsonb', {
    name: 'subscription_pricing',
    default: {
      basePrice: 0,
      currentPrice: 0,
      discountPercentage: 0
    },
    nullable: true
  })
  subscriptionPricing?: {
    basePrice: number;
    currentPrice: number;
    discountPercentage: number;
  };

  @Column({
    name: 'subscription_status',
    type: 'enum',
    enum: ['active', 'inactive', 'pending', 'cancelled'] as SubscriptionStatus[],
    default: 'active'
  })
  subscriptionStatus!: SubscriptionStatus;

  @Column('jsonb', {
    name: 'data_sharing',
    default: {
      sharingLevel: 'none',
      anonymizeAmount: true,
      anonymizeDates: true,
      customCategories: false
    }
  })
  dataSharing!: {
    sharingLevel: 'none' | 'basic' | 'full';
    anonymizeAmount: boolean;
    anonymizeDates: boolean;
    customCategories: boolean;
  };

  @Column('text', {
    name: 'plaid_item_ids',
    array: true,
    nullable: true,
    default: []
  })
  plaidItemIds!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // Relationships
  @OneToMany(() => Account, (account) => account.user)
  accounts?: Account[];

  @OneToMany(() => Bill, (bill) => bill.user)
  bills?: Bill[];

  @OneToMany(() => BillRecommendation, (recommendation) => recommendation.user)
  billRecommendations?: BillRecommendation[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions?: Transaction[];

  // Virtual fields
  get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ');
  }

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateEmail(): void {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  // Helper methods
  hasActiveSubscription(): boolean {
    return this.subscriptionStatus === 'active';
  }

  isPremium(): boolean {
    return this.subscription === 'premium' && this.hasActiveSubscription();
  }

  isEssential(): boolean {
    return this.subscription === 'essential' && this.hasActiveSubscription();
  }

  isDataPartner(): boolean {
    return this.subscription === 'data_partner' && this.hasActiveSubscription();
  }
  
  // For backward compatibility with existing code
  isEnterprise(): boolean {
    return this.isDataPartner(); // data_partner is the new enterprise tier
  }

  canAccessFeature(feature: Feature): boolean {
    switch (feature) {
      case 'ai_recommendations':
      case 'bill_optimization':
        return this.isPremium() || this.isEnterprise();
      case 'advanced_analytics':
        return this.isEnterprise();
      case 'basic':
        return true;
      default:
        return false;
    }
  }

  hasOverdueBills(): boolean {
    if (!this.bills) return false;
    return this.bills.some(bill => bill.isOverdue);
  }

  getUpcomingBills(days: number = 7): Bill[] {
    if (!this.bills) return [];
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.bills.filter(bill => {
      const dueDate = new Date(bill.dueDate);
      return dueDate >= today && dueDate <= futureDate;
    });
  }

  // Serialization
  toJSON(): UserData {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userData } = this;
    return userData;
  }

  // Factory method
  static create(params: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): User {
    const user = new User();
    Object.assign(user, params);
    return user;
  }
}