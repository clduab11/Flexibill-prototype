-- Table: users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    subscription TEXT NOT NULL DEFAULT 'free',
    dataSharing JSONB NOT NULL DEFAULT '{"sharingLevel":"none","anonymizeAmount":false,"anonymizeDates":false}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: bills
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    dueDate TIMESTAMPTZ NOT NULL,
    category TEXT,
    frequency TEXT NOT NULL DEFAULT 'monthly',
    autopay BOOLEAN NOT NULL DEFAULT false
);

-- Table: accounts
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plaidAccessToken TEXT,
    institution TEXT,
    mask TEXT,
    type TEXT NOT NULL DEFAULT 'checking'
);