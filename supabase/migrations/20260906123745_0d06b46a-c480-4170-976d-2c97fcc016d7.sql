CREATE TABLE public.staff_designations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.staff_designations TO authenticated;
GRANT ALL ON public.staff_designations TO service_role;

ALTER TABLE public.staff_designations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view designations" ON public.staff_designations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage designations" ON public.staff_designations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_staff_designations_updated_at
  BEFORE UPDATE ON public.staff_designations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS designation text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS must_change_credentials boolean NOT NULL DEFAULT false;

INSERT INTO public.staff_designations (name, sort_order) VALUES
  ('Sales Agent', 1),
  ('Delivery Rider', 2),
  ('Support Agent', 3),
  ('Store Manager', 4)
ON CONFLICT (name) DO NOTHING;