-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    subscription VARCHAR(20) DEFAULT 'free',
    subscription_status VARCHAR(20) DEFAULT 'active',
    plaid_item_ids TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plaid_account_id VARCHAR(255) NOT NULL,
    plaid_item_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    official_name VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    subtype VARCHAR(50),
    mask VARCHAR(4),
    balance_current DECIMAL(12,2),
    balance_available DECIMAL(12,2),
    balance_limit DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, plaid_account_id)
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    plaid_transaction_id VARCHAR(255),
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    merchant_name VARCHAR(255),
    category TEXT[],
    category_id VARCHAR(255),
    pending BOOLEAN DEFAULT false,
    payment_channel VARCHAR(50),
    location JSONB,
    is_recurring BOOLEAN DEFAULT false,
    recurring_rule_id UUID,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, plaid_transaction_id)
);

-- Bills table
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    category VARCHAR(100),
    autopay BOOLEAN DEFAULT false,
    reminder_days INTEGER[],
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bill recommendations table
CREATE TABLE bill_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    current_due_date DATE NOT NULL,
    recommended_due_date DATE NOT NULL,
    reason TEXT NOT NULL,
    savings_estimate DECIMAL(12,2),
    confidence_score DECIMAL(5,4),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cash flow analysis table
CREATE TABLE cash_flow_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    income_days DATE[],
    high_expense_days DATE[],
    low_balance_days DATE[],
    projected_balances JSONB,
    recommendations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recurring transaction rules table
CREATE TABLE recurring_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    merchant_name VARCHAR(255),
    frequency VARCHAR(20) NOT NULL,
    amount_min DECIMAL(12,2) NOT NULL,
    amount_max DECIMAL(12,2) NOT NULL,
    amount_typical DECIMAL(12,2) NOT NULL,
    day_of_month INTEGER,
    day_of_week INTEGER,
    detect_pattern JSONB NOT NULL,
    last_occurrence DATE,
    next_expected_date DATE,
    confidence DECIMAL(5,4) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_transactions_user_id_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_recurring ON transactions(user_id, is_recurring);
CREATE INDEX idx_bills_user_id_due_date ON bills(user_id, due_date);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_recurring_rules_user_id ON recurring_rules(user_id);
CREATE INDEX idx_bill_recommendations_user_id ON bill_recommendations(user_id);
CREATE INDEX idx_bill_recommendations_status ON bill_recommendations(status);
CREATE INDEX idx_cash_flow_analysis_user_id_dates ON cash_flow_analysis(user_id, start_date, end_date);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at
    BEFORE UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bill_recommendations_updated_at
    BEFORE UPDATE ON bill_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_rules_updated_at
    BEFORE UPDATE ON recurring_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add test data in development environment
DO $$
BEGIN
    IF current_setting('environment') = 'development' THEN
        -- Add test data here
        -- This will be implemented later when needed
    END IF;
END $$;