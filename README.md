# FlexiBill

FlexiBill is a mobile-first personal finance app that helps users manage bill schedules and request due date changes to better align with their cash flow.

## Features

- Account linking via Plaid
- Bill management and visualization
- AI-powered recommendations for bill due date changes
- Cash flow analysis
- Data sharing preferences with subscription tiers

## Project Structure

```
/flexibill
  /backend - Node.js/Express backend with TypeScript
  /mobile - React Native mobile app with TypeScript
  /shared - Shared types and utilities
```

## Prerequisites

- Node.js 18+
- npm or yarn
- Plaid developer account
- Supabase account

## Development Setup

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd flexibill/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values with your Plaid API keys, Supabase credentials, etc.

4. Start the development server:
   ```
   npm run dev
   ```

### Mobile Setup

1. Navigate to the mobile directory:
   ```
   cd flexibill/mobile
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the React Native development server:
   ```
   npm start
   ```

4. Run on iOS or Android:
   ```
   npm run ios
   # or
   npm run android
   ```

## Database Setup

1. Create a new Supabase project
2. Run the SQL scripts in `flexibill/backend/db/initSchema.sql` to set up the database schema

## Phase 1 Implementation

Phase 1 focuses on the core functionality:

- Account linking via Plaid
- Bill view UI
- Basic AI recommendations
- Due date change request (email template generation)

## Testing

Run tests for the backend:
```
cd flexibill/backend
npm test
```

Run tests for the mobile app:
```
cd flexibill/mobile
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
