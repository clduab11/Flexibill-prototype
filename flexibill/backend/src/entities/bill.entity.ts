import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check
} from 'typeorm';
import { User } from './user.entity';
import { BillRecommendation } from './bill-recommendation.entity';

export type BillFrequency = 'once' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type BillStatus = 'active' | 'inactive' | 'paid' | 'overdue' | 'cancelled';

export interface BillData {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dueDate: Date;
  frequency: BillFrequency;
  category?: string;
  autopay: boolean;
  reminderDays: number[];
  status: BillStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Entity('bills')
@Index(['userId', 'dueDate'])
@Check(`"amount" > 0`)
export class Bill implements BillData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2
  })
  amount!: number;

  @Column({ name: 'due_date', type: 'date' })
  @Index()
  dueDate!: Date;

  @Column({
    type: 'enum',
    enum: ['once', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] as BillFrequency[]
  })
  frequency!: BillFrequency;

  @Column({ length: 100, nullable: true })
  category?: string;

  @Column({ default: false })
  autopay!: boolean;

  @Column('int', { name: 'reminder_days', array: true, default: [] })
  reminderDays!: number[];

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'paid', 'overdue', 'cancelled'] as BillStatus[],
    default: 'active'
  })
  status!: BillStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.bills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(() => BillRecommendation, (recommendation) => recommendation.bill)
  recommendations?: BillRecommendation[];

  // Virtual getters
  get isOverdue(): boolean {
    if (this.status === 'paid' || this.status === 'cancelled') return false;
    return new Date() > this.dueDate;
  }

  get daysUntilDue(): number {
    const today = new Date();
    const dueDate = new Date(this.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get nextDueDate(): Date {
    const current = new Date(this.dueDate);
    
    switch (this.frequency) {
      case 'once':
        return current;
      case 'weekly':
        return new Date(current.setDate(current.getDate() + 7));
      case 'biweekly':
        return new Date(current.setDate(current.getDate() + 14));
      case 'monthly':
        return new Date(current.setMonth(current.getMonth() + 1));
      case 'quarterly':
        return new Date(current.setMonth(current.getMonth() + 3));
      case 'yearly':
        return new Date(current.setFullYear(current.getFullYear() + 1));
      default:
        return current;
    }
  }

  get activeRecommendations(): BillRecommendation[] {
    return this.recommendations?.filter(rec => 
      rec.status === 'pending' || rec.status === 'accepted'
    ) || [];
  }

  // Helper methods
  shouldSendReminder(): boolean {
    if (this.status !== 'active') return false;
    
    const daysLeft = this.daysUntilDue;
    return this.reminderDays.includes(daysLeft);
  }

  isWithinReminderPeriod(): boolean {
    if (this.reminderDays.length === 0) return false;
    
    const daysLeft = this.daysUntilDue;
    const maxReminderDays = Math.max(...this.reminderDays);
    return daysLeft <= maxReminderDays;
  }

  markAsPaid(): void {
    this.status = 'paid';
    
    // If recurring, update due date to next occurrence
    if (this.frequency !== 'once') {
      this.dueDate = this.nextDueDate;
      this.status = 'active';
    }
  }

  updateStatus(): void {
    if (this.status === 'cancelled' || this.status === 'paid') return;

    if (this.isOverdue) {
      this.status = 'overdue';
    } else if (this.status === 'overdue') {
      this.status = 'active';
    }
  }

  // Serialization
  toJSON(): BillData {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user: _, recommendations: __, ...billData } = this;
    return billData;
  }

  // Factory method
  static create(params: Partial<Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>>): Bill {
    const bill = new Bill();
    Object.assign(bill, params);
    return bill;
  }
}