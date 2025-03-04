-- Test data for development environment
DO $$
DECLARE
    test_user_id UUID;
    test_account_id UUID;
    test_bill_id UUID;
BEGIN
    -- Only run in development environment
    IF current_setting('environment') != 'development' THEN
        RAISE NOTICE 'Skipping test data creation in non-development environment';
        RETURN;
    END IF;

    -- Clear existing test data
    DELETE FROM users WHERE email LIKE 'test%@example.com';

    -- Create test user
    INSERT INTO users (
        id,
        email,
        password_hash,
        first_name,
        last_name,
        subscription,
        subscription_status
    ) VALUES (
        uuid_generate_v4(),
        'test@example.com',
        '$2b$10$TestHashedPasswordForDevelopment',
        'Test',
        'User',
        'premium',
        'active'
    ) RETURNING id INTO test_user_id;

    -- Create test accounts
    INSERT INTO accounts (
        id,
        user_id,
        plaid_account_id,
        plaid_item_id,
        name,
        official_name,
        type,
        subtype,
        mask,
        balance_current,
        balance_available,
        currency
    ) VALUES
    (
        uuid_generate_v4(),
        test_user_id,
        'test_checking_account',
        'test_item_1',
        'Test Checking',
        'TEST CHECKING ACCOUNT',
        'depository',
        'checking',
        '1234',
        5000.00,
        4800.00,
        'USD'
    ) RETURNING id INTO test_account_id;

    -- Create test bills
    INSERT INTO bills (
        id,
        user_id,
        name,
        amount,
        due_date,
        frequency,
        category,
        autopay,
        reminder_days
    ) VALUES
    (
        uuid_generate_v4(),
        test_user_id,
        'Netflix Subscription',
        15.99,
        CURRENT_DATE + INTERVAL '15 days',
        'monthly',
        'Entertainment',
        true,
        ARRAY[3, 7]
    ) RETURNING id INTO test_bill_id;

    -- Create test transactions
    INSERT INTO transactions (
        id,
        user_id,
        account_id,
        plaid_transaction_id,
        amount,
        date,
        name,
        merchant_name,
        category,
        pending,
        payment_channel,
        is_recurring,
        tags
    ) VALUES
    (
        uuid_generate_v4(),
        test_user_id,
        test_account_id,
        'test_tx_1',
        15.99,
        CURRENT_DATE - INTERVAL '1 month',
        'Netflix',
        'NETFLIX',
        ARRAY['Entertainment', 'Subscription'],
        false,
        'online',
        true,
        ARRAY['streaming', 'entertainment']
    ),
    (
        uuid_generate_v4(),
        test_user_id,
        test_account_id,
        'test_tx_2',
        15.99,
        CURRENT_DATE,
        'Netflix',
        'NETFLIX',
        ARRAY['Entertainment', 'Subscription'],
        false,
        'online',
        true,
        ARRAY['streaming', 'entertainment']
    ),
    (
        uuid_generate_v4(),
        test_user_id,
        test_account_id,
        'test_tx_3',
        85.45,
        CURRENT_DATE - INTERVAL '2 days',
        'Walmart Grocery',
        'WALMART',
        ARRAY['Shopping', 'Groceries'],
        false,
        'in store',
        false,
        ARRAY['groceries', 'essential']
    );

    -- Create test bill recommendation
    INSERT INTO bill_recommendations (
        id,
        user_id,
        bill_id,
        current_due_date,
        recommended_due_date,
        reason,
        savings_estimate,
        confidence_score,
        status
    ) VALUES (
        uuid_generate_v4(),
        test_user_id,
        test_bill_id,
        CURRENT_DATE + INTERVAL '15 days',
        CURRENT_DATE + INTERVAL '20 days',
        'Aligning with your typical income deposit dates could help avoid potential overdraft',
        25.00,
        0.85,
        'pending'
    );

    -- Create recurring rule for Netflix
    INSERT INTO recurring_rules (
        id,
        user_id,
        name,
        merchant_name,
        frequency,
        amount_min,
        amount_max,
        amount_typical,
        day_of_month,
        detect_pattern,
        last_occurrence,
        next_expected_date,
        confidence
    ) VALUES (
        uuid_generate_v4(),
        test_user_id,
        'Netflix Subscription',
        'NETFLIX',
        'monthly',
        15.99,
        15.99,
        15.99,
        EXTRACT(DAY FROM CURRENT_DATE)::INTEGER,
        jsonb_build_object(
            'namePattern', 'Netflix',
            'merchantPattern', 'NETFLIX',
            'amountVariance', 0,
            'dateVariance', 1
        ),
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '1 month',
        0.98
    );

    -- Create cash flow analysis
    INSERT INTO cash_flow_analysis (
        id,
        user_id,
        period,
        start_date,
        end_date,
        income_days,
        high_expense_days,
        low_balance_days,
        projected_balances,
        recommendations
    ) VALUES (
        uuid_generate_v4(),
        test_user_id,
        'monthly',
        DATE_TRUNC('month', CURRENT_DATE),
        (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE,
        ARRAY[DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '15 days'],
        ARRAY[DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 day'],
        ARRAY[DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '14 days'],
        '[
            {"date": "2025-03-01", "balance": 5000.00},
            {"date": "2025-03-15", "balance": 4500.00},
            {"date": "2025-03-30", "balance": 4000.00}
        ]'::jsonb,
        '[
            {
                "type": "move_bill",
                "description": "Consider moving Netflix payment to after your regular income deposit",
                "impact": 25.00
            }
        ]'::jsonb
    );

    RAISE NOTICE 'Test data created successfully';
END $$;