# FlexiBill LLM Implementation Prompt

You are tasked with implementing the FlexiBill mobile application, a financial management app that helps users manage bill due dates and offers innovative data-sharing features. Follow these implementation instructions precisely.

## Project Overview

FlexiBill is a React Native mobile app with a Node.js/TypeScript backend, using Supabase for database and authentication, integrated with Plaid for financial data, and Azure OpenAI Service for AI features.

## Your Role & Responsibilities

You will act as a senior software engineer implementing this application. You should:
1. Follow TypeScript best practices
2. Implement proper error handling
3. Write unit tests for all components
4. Ensure security best practices
5. Document all code thoroughly
6. Implement proper logging

## Technical Stack

- Frontend: React Native with TypeScript
- Backend: Node.js/TypeScript with Express
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- Financial Integration: Plaid API
- AI Services: Azure OpenAI Service (primary), OpenAI API (premium features)
- Cloud: Azure
- Testing: Jest, React Native Testing Library

## Implementation Phases

### Phase 1: Project Setup & Foundation

Start by acknowledging this phase and confirming you'll implement it according to these specifications:

```typescript
// Project structure
flexibill/
├── mobile/          // React Native app
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── utils/
│   └── __tests__/
├── backend/         // Node.js/Express server
│   ├── src/
│   │   ├── api/
│   │   ├── services/
│   │   ├── models/
│   │   └── utils/
│   └── tests/
└── shared/         // Shared types and constants
    ├── types/
    └── constants/

// Key type definitions to implement
interface User {
  id: string;
  email: string;
  subscription: 'free' | 'premium';
  dataSharing: DataSharingPreferences;
  created_at: Date;
}

interface Bill {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dueDate: Date;
  category: string;
  frequency: 'monthly' | 'weekly' | 'yearly';
  autopay: boolean;
}

interface Account {
  id: string;
  userId: string;
  plaidAccessToken: string;
  institution: string;
  mask: string;
  type: 'checking' | 'savings' | 'credit';
}
```

Tasks to complete in order:

1. Initialize React Native project with TypeScript
2. Set up Node.js backend with Express and TypeScript
3. Configure Supabase and create initial schema
4. Implement basic authentication flow
5. Set up project structure and shared types

Confirm completion of each task before moving to the next phase.

### Phase 2: Core Features

Once Phase 1 is complete, proceed with these core features:

1. Plaid Integration:
```typescript
// Implement this interface
interface PlaidService {
  initializePlaidLink(): Promise<void>;
  exchangePublicToken(publicToken: string): Promise<string>;
  fetchTransactions(accessToken: string): Promise<Transaction[]>;
  syncAccounts(userId: string): Promise<void>;
}

// Implement this component
interface PlaidLinkProps {
  onSuccess: (publicToken: string) => void;
  onExit: () => void;
}
```

2. Bill Management:
```typescript
// Implement these endpoints
interface BillsAPI {
  '/bills':
    POST: (bill: Omit<Bill, 'id'>) => Promise<Bill>
    GET: (userId: string) => Promise<Bill[]>
  '/bills/:id':
    PUT: (id: string, updates: Partial<Bill>) => Promise<Bill>
    DELETE: (id: string) => Promise<void>
  '/bills/:id/change-date':
    POST: (id: string, newDate: Date) => Promise<Bill>
}

// Implement this service
interface BillService {
  createBill(bill: Omit<Bill, 'id'>): Promise<Bill>;
  updateBill(id: string, updates: Partial<Bill>): Promise<Bill>;
  deleteBill(id: string): Promise<void>;
  requestDateChange(id: string, newDate: Date): Promise<Bill>;
  getBillsByUser(userId: string): Promise<Bill[]>;
}
```

3. Basic AI Features:
```typescript
// Implement this service
interface AIService {
  analyzeBillPattern(bills: Bill[]): Promise<BillAnalysis>;
  generateRecommendations(analysis: BillAnalysis): Promise<Recommendation[]>;
  explainRecommendation(rec: Recommendation): Promise<string>;
}

interface BillAnalysis {
  riskScore: number;
  potentialLateFees: number;
  cashFlowImpact: {
    weekly: number[];
    monthly: number;
  };
}
```

### Phase 3: Premium Features

After completing core features, implement premium features:

1. Data Sharing System:
```typescript
interface DataSharingService {
  getAnonymizedData(userId: string): Promise<AnonymizedData>;
  updateSharingPreferences(
    userId: string, 
    preferences: DataSharingPreferences
  ): Promise<void>;
  calculateDiscountTier(
    sharingLevel: SharingLevel
  ): Promise<SubscriptionDiscount>;
}

type SharingLevel = 'none' | 'basic' | 'full';
```

2. Premium AI Features:
```typescript
interface PremiumAIService extends AIService {
  predictFutureBills(
    history: Transaction[], 
    timeframe: number
  ): Promise<PredictedBill[]>;
  optimizeDueDates(
    bills: Bill[], 
    cashFlow: CashFlowPattern
  ): Promise<DateOptimizationPlan>;
  generateDetailedInsights(
    userData: UserFinancialData
  ): Promise<FinancialInsights>;
}
```

## Testing Requirements

Implement tests for all features:

```typescript
// Example test structure
describe('BillService', () => {
  describe('createBill', () => {
    it('should create a new bill');
    it('should validate bill data');
    it('should handle errors');
  });
  
  describe('requestDateChange', () => {
    it('should update bill due date');
    it('should validate new date');
    it('should handle provider errors');
  });
});
```

## Security Requirements

Implement these security measures:

1. Data Encryption:
```typescript
interface EncryptionService {
  encrypt(data: any): Promise<string>;
  decrypt(encrypted: string): Promise<any>;
  hashSensitiveData(data: string): Promise<string>;
}
```

2. Authentication:
```typescript
interface AuthService {
  login(email: string, password: string): Promise<Session>;
  register(email: string, password: string): Promise<User>;
  validateSession(token: string): Promise<boolean>;
  refreshToken(token: string): Promise<string>;
}
```

## Implementation Instructions

For each component or service:

1. Start with interfaces and types
2. Implement core functionality
3. Add error handling
4. Write unit tests
5. Add documentation
6. Implement logging

Example implementation pattern:

```typescript
/**
 * Service for managing bill-related operations
 */
class BillService implements IBillService {
  private logger: Logger;
  private db: Database;

  constructor(db: Database, logger: Logger) {
    this.db = db;
    this.logger = logger;
  }

  /**
   * Creates a new bill for a user
   * @param bill The bill data to create
   * @returns The created bill
   * @throws {ValidationError} If bill data is invalid
   * @throws {DatabaseError} If database operation fails
   */
  async createBill(bill: Omit<Bill, 'id'>): Promise<Bill> {
    try {
      this.logger.info('Creating new bill', { userId: bill.userId });
      
      // Validate bill data
      validateBillData(bill);
      
      // Create bill in database
      const created = await this.db.bills.create(bill);
      
      this.logger.info('Bill created successfully', { billId: created.id });
      
      return created;
    } catch (error) {
      this.logger.error('Failed to create bill', { error });
      throw new BillServiceError('Failed to create bill', { cause: error });
    }
  }
}
```

## Checkpoints

After implementing each major feature:

1. Run all tests
2. Check TypeScript compilation
3. Verify security measures
4. Test error handling
5. Validate documentation
6. Check code coverage

## Getting Started

Acknowledge this prompt and begin with Phase 1. For each task:

1. Show the code you'll implement
2. Explain your implementation approach
3. Highlight any security or performance considerations
4. Describe how you'll test the implementation

Ready to begin implementation?