# FlexiBill Backend

The backend service for FlexiBill, providing API endpoints for bill management, financial data integration, and AI-powered insights.

## Features

- Plaid integration for bank account connectivity
- Bill management and tracking
- Transaction syncing and categorization
- AI-powered bill optimization
- Cash flow analysis
- Premium insights and recommendations

## Prerequisites

- Node.js >= 16
- PostgreSQL >= 13
- Plaid account with API credentials
- Azure OpenAI account with API credentials

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your configuration values.

3. Build the shared types:
   ```bash
   cd ../shared && npm install && npm run build
   ```

4. Link the shared package:
   ```bash
   cd ../backend && npm link ../shared
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

### Authentication

All endpoints except `/api/plaid/webhook` require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Plaid Integration
- `POST /api/plaid/create-link-token` - Create a Plaid Link token
- `POST /api/plaid/exchange-public-token` - Exchange public token for access token
- `GET /api/plaid/accounts` - Get linked accounts
- `POST /api/plaid/sync-transactions` - Sync transactions for an account
- `POST /api/plaid/webhook` - Webhook endpoint for Plaid events

#### Bills
- `GET /api/bills` - Get all bills
- `POST /api/bills` - Create a new bill
- `PUT /api/bills/:id` - Update a bill
- `DELETE /api/bills/:id` - Delete a bill

#### Transactions
- `GET /api/transactions` - Get transactions with filtering
- `GET /api/transactions/recurring` - Get recurring transactions
- `PUT /api/transactions/:id/tags` - Update transaction tags
- `POST /api/transactions/categorize` - Categorize transactions

#### AI Features
- `GET /api/ai/bill-recommendations` - Get bill payment optimization recommendations
- `GET /api/ai/cash-flow` - Get cash flow analysis
- `GET /api/ai/premium-insights` - Get premium AI insights (premium only)
- `POST /api/ai/optimize-schedule` - Optimize bill payment schedule
- `GET /api/ai/savings-opportunities` - Get detected savings opportunities

## Development

### Code Structure
- `/src/api` - API route handlers
- `/src/services` - Business logic and external service integrations
- `/src/db` - Database models and queries
- `/src/middleware` - Express middleware

### Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run linting
npm run lint
```

### Error Handling
The application uses a global error handler that converts errors to appropriate HTTP responses. Custom error classes are available in `src/utils/errors.ts`.

### Logging
Logging is configured based on environment variables:
- `LOG_LEVEL` controls verbosity
- `ENABLE_REQUEST_LOGGING` enables HTTP request logging
- `ENABLE_RESPONSE_LOGGING` enables HTTP response logging

### Security
- Rate limiting is enabled for all endpoints
- Request validation using TypeScript types
- CORS is configured for the frontend origin
- All environment variables are validated at startup

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

Copyright (c) 2025 FlexiBill. All rights reserved.