CREATE TABLE public.webauthn_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('admin','vendor')),
  vendor_username TEXT,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT[] NOT NULL DEFAULT '{}',
  label TEXT NOT NULL DEFAULT 'This device',
  secret TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);
GRANT ALL ON public.webauthn_credentials TO service_role;
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.webauthn_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge TEXT NOT NULL,
  scope TEXT NOT NULL,
  purpose TEXT NOT NULL,
  vendor_username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '5 minutes'
);
GRANT ALL ON public.webauthn_challenges TO service_role;
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

CREATE INDEX webauthn_credentials_scope_idx ON public.webauthn_credentials (scope, vendor_username);
CREATE INDEX webauthn_challenges_challenge_idx ON public.webauthn_challenges (challenge);