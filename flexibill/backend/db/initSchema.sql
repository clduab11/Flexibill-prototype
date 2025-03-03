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

-- Table: transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accountId UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    category TEXT,
    name TEXT NOT NULL,
    pending BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB
);

-- Table: date_change_requests
CREATE TABLE IF NOT EXISTS public.date_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billId UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    userId UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    currentDueDate TIMESTAMPTZ NOT NULL,
    requestedDueDate TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);