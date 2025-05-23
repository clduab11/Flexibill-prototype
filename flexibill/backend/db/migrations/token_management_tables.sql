-- Create the token_families table
CREATE TABLE IF NOT EXISTS token_families (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE NULL,
  
  -- Add indexes for faster lookups
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_token_families_user_id ON token_families(user_id);
CREATE INDEX IF NOT EXISTS idx_token_families_is_revoked ON token_families(is_revoked);

-- Create the refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_family UUID NOT NULL REFERENCES token_families(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_refreshed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE NULL,
  
  -- Add indexes for faster lookups
  CONSTRAINT fk_token_family FOREIGN KEY (token_family) REFERENCES token_families(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_family ON refresh_tokens(token_family);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Create a view to help with token cleanup
CREATE OR REPLACE VIEW expired_tokens AS
SELECT id, token, expires_at
FROM refresh_tokens
WHERE expires_at < NOW() AND is_revoked = false;

-- Create a view to detect suspicious token activity
CREATE OR REPLACE VIEW suspicious_token_activity AS
SELECT user_id, COUNT(*) as refresh_count
FROM refresh_tokens
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND is_revoked = false
GROUP BY user_id
HAVING COUNT(*) > 10; -- Threshold for suspicious activity
