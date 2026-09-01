CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);
INSERT INTO public.site_settings (key, value) VALUES ('ticker_style', '{"height":26,"font_size":12,"speed":22,"bg_from":"#e23c1f","bg_to":"#f07a20","text_color":"#ffffff","bold":true,"gap":40,"enabled":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;