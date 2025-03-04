import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check
} from 'typeorm';
import { User } from './user.entity';
import { Bill } from './bill.entity';

export type RecommendationType = 'due_date' | 'payment_method' | 'consolidation' | 'reminder' | 'other';
export type RecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'implemented' | 'expired';

export interface BillRecommendationData {
  id: string;
  userId: string;
  billId: string;
  type: RecommendationType;
  currentDueDate: Date;
  recommendedDueDate?: Date;
  reason: string;
  savingsEstimate?: number;
  confidenceScore: number;
  status: RecommendationStatus;
  metadata?: Record<string, unknown>;
  implementedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Entity('bill_recommendations')
@Index(['userId', 'billId'])
export class BillRecommendation implements BillRecommendationData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'bill_id' })
  billId!: string;

  @Column({
    type: 'enum',
    enum: ['due_date', 'payment_method', 'consolidation', 'reminder', 'other']
  })
  type!: RecommendationType;

  @Column({ name: 'current_due_date', type: 'date' })
  currentDueDate!: Date;

  @Column({ name: 'recommended_due_date', type: 'date', nullable: true })
  recommendedDueDate?: Date;

  @Column({ type: 'text' })
  reason!: string;

  @Column({
    name: 'savings_estimate',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true
  })
  savingsEstimate?: number;

  @Column({
    name: 'confidence_score',
    type: 'decimal',
    precision: 5,
    scale: 4
  })
  @Check(`"confidence_score" >= 0 AND "confidence_score" <= 1`)
  confidenceScore!: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'rejected', 'implemented', 'expired'],
    default: 'pending'
  })
  status!: RecommendationStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'implemented_at', type: 'timestamptz', nullable: true })
  implementedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.billRecommendations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Bill, (bill) => bill.recommendations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bill_id' })
  bill?: Bill;

  // Virtual getters
  get isImplementable(): boolean {
    return this.status === 'accepted' && !this.implementedAt && !this.isExpired;
  }

  get isExpired(): boolean {
    return (
      this.status === 'expired' ||
      (this.type === 'due_date' &&
        this.recommendedDueDate !== undefined &&
        new Date() > this.recommendedDueDate)
    );
  }

  get savingsPerYear(): number {
    if (!this.savingsEstimate) return 0;
    if (!this.bill) return this.savingsEstimate;

    switch (this.bill.frequency) {
      case 'weekly':
        return this.savingsEstimate * 52;
      case 'biweekly':
        return this.savingsEstimate * 26;
      case 'monthly':
        return this.savingsEstimate * 12;
      case 'quarterly':
        return this.savingsEstimate * 4;
      case 'yearly':
        return this.savingsEstimate;
      case 'once':
      default:
        return this.savingsEstimate;
    }
  }

  // Helper methods
  accept(): void {
    if (this.status !== 'pending') {
      throw new Error('Can only accept pending recommendations');
    }
    this.status = 'accepted';
  }

  reject(): void {
    if (this.status !== 'pending') {
      throw new Error('Can only reject pending recommendations');
    }
    this.status = 'rejected';
  }

  implement(): void {
    if (!this.isImplementable) {
      throw new Error('Recommendation cannot be implemented');
    }
    this.status = 'implemented';
    this.implementedAt = new Date();
  }

  expire(): void {
    if (this.status === 'implemented') {
      throw new Error('Cannot expire implemented recommendations');
    }
    this.status = 'expired';
  }

  // Serialization
  toJSON(): BillRecommendationData {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user: _, bill: __, ...recommendationData } = this;
    return recommendationData;
  }

  // Factory method
  static create(params: Partial<Omit<BillRecommendation, 'id' | 'createdAt' | 'updatedAt'>>): BillRecommendation {
    const recommendation = new BillRecommendation();
    Object.assign(recommendation, params);
    return recommendation;
  }
}