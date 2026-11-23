-- ==============================================================================
-- ADD IP_BANS TABLE FOR RATE LIMITER PERSISTENCE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ip_bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip VARCHAR(100) UNIQUE NOT NULL,
    banned_until TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ip_bans_ip ON public.ip_bans(ip);
CREATE INDEX IF NOT EXISTS idx_ip_bans_banned_until ON public.ip_bans(banned_until);

ALTER TABLE public.ip_bans ENABLE ROW LEVEL SECURITY;
