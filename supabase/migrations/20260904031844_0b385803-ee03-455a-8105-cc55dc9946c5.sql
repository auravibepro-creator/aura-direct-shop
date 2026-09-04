-- Lock down credential/challenge tables to server-side (service role) access only.
REVOKE ALL ON public.vendors FROM anon, authenticated;
REVOKE ALL ON public.webauthn_credentials FROM anon, authenticated;
REVOKE ALL ON public.webauthn_challenges FROM anon, authenticated;

GRANT ALL ON public.vendors TO service_role;
GRANT ALL ON public.webauthn_credentials TO service_role;
GRANT ALL ON public.webauthn_challenges TO service_role;

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.vendors FORCE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_credentials FORCE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_challenges FORCE ROW LEVEL SECURITY;

-- Explicit deny-all policies so the intent is documented and no implicit access exists.
DROP POLICY IF EXISTS "Deny all client access to vendors" ON public.vendors;
CREATE POLICY "Deny all client access to vendors" ON public.vendors
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Deny all client access to webauthn_credentials" ON public.webauthn_credentials;
CREATE POLICY "Deny all client access to webauthn_credentials" ON public.webauthn_credentials
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Deny all client access to webauthn_challenges" ON public.webauthn_challenges;
CREATE POLICY "Deny all client access to webauthn_challenges" ON public.webauthn_challenges
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);