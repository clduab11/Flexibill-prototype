-- Migration for new pricing model with data sharing discount feature

-- 1. Update subscription enum to include new tiers
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_subscription_check;

-- 2. Add check constraint with updated subscription options
ALTER TABLE users 
  ADD CONSTRAINT users_subscription_check 
  CHECK (subscription IN ('free', 'essential', 'premium', 'data_partner'));

-- 3. Add subscription_pricing column for storing price calculations
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS subscription_pricing JSONB DEFAULT '{"basePrice": 0, "currentPrice": 0, "discountPercentage": 0}';

-- 4. Add data_sharing column for storing sharing preferences
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS data_sharing JSONB DEFAULT '{"sharingLevel": "none", "anonymizeAmount": true, "anonymizeDates": true, "customCategories": false}';

-- 5. Update existing users to default sharing level
UPDATE users
  SET data_sharing = '{"sharingLevel": "none", "anonymizeAmount": true, "anonymizeDates": true, "customCategories": false}'
  WHERE data_sharing IS NULL;

-- 6. Set default subscription pricing for existing users
UPDATE users
  SET subscription_pricing = CASE
    WHEN subscription = 'free' THEN '{"basePrice": 0, "currentPrice": 0, "discountPercentage": 0}'
    WHEN subscription = 'premium' THEN '{"basePrice": 19.99, "currentPrice": 19.99, "discountPercentage": 0}'
    WHEN subscription = 'enterprise' THEN '{"basePrice": 24.99, "currentPrice": 24.99, "discountPercentage": 0}'
    ELSE '{"basePrice": 0, "currentPrice": 0, "discountPercentage": 0}'
  END
  WHERE subscription_pricing IS NULL;

-- 7. Convert existing enterprise subscriptions to data_partner
UPDATE users
  SET subscription = 'data_partner'
  WHERE subscription = 'enterprise';