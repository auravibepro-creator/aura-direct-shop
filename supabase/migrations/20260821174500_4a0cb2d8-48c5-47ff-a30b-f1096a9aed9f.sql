CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT '✨',
  image_url TEXT,
  is_hot BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(10,2),
  images TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT,
  variants TEXT[] NOT NULL DEFAULT '{}',
  stock INTEGER NOT NULL DEFAULT 100,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.8,
  sold_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly viewable" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Active products are publicly viewable" ON public.products FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "Active announcements are publicly viewable" ON public.announcements FOR SELECT TO anon, authenticated USING (is_active);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.categories (name, slug, icon, is_hot, sort_order) VALUES
  ('Cosmetics', 'cosmetics', '💄', true, 1),
  ('Hair Removal Spray', 'hair-removal-spray', '🧴', true, 2),
  ('Nail Polish Thinner', 'nail-polish-thinner', '💅', false, 3),
  ('Face Masks', 'face-masks', '🧖', true, 4),
  ('Personal Care', 'personal-care', '🛁', false, 5);

INSERT INTO public.announcements (message, sort_order) VALUES
  ('🔥 FLASH SALE — Up to 60% OFF on Cosmetics today only!', 1),
  ('🚚 FREE Delivery on orders above Rs. 2,500', 2),
  ('⚡ New arrivals every week — Live Your AuraVibe', 3),
  ('💰 Cash on Delivery available all over Pakistan', 4);

INSERT INTO public.products (name, description, price, compare_at_price, images, variants, stock, rating, sold_count, is_featured, category_id)
SELECT seed.name, seed.description, seed.price, seed.compare_at_price, seed.images, seed.variants, seed.stock, seed.rating, seed.sold_count, seed.is_featured, c.id
FROM (VALUES
  ('Velvet Matte Lipstick Set', 'Long-lasting velvet matte finish lipstick set. Highly pigmented, transfer-proof and enriched with vitamin E for soft, nourished lips all day.', 1450::numeric, 2900::numeric, ARRAY['/images/cosmetics-1.jpg','/images/cosmetics-2.jpg'], ARRAY['Ruby Red','Nude Rose','Deep Plum'], 120, 4.9::numeric, 3421, true, 'cosmetics'),
  ('Glow Foundation Stick', 'Buildable medium-to-full coverage foundation stick with a natural dewy finish. Blends effortlessly, no cakey look.', 1890, 3400, ARRAY['/images/cosmetics-2.jpg','/images/cosmetics-1.jpg'], ARRAY['Ivory','Beige','Warm Tan'], 80, 4.7, 1890, true, 'cosmetics'),
  ('12-Color Eyeshadow Palette', 'Ultra-blendable shimmer and matte shades in one travel-friendly palette. Rich pigment, minimal fallout.', 1290, 2600, ARRAY['/images/cosmetics-1.jpg'], ARRAY['Warm Nudes','Smoky Nights'], 95, 4.8, 2210, false, 'cosmetics'),
  ('Painless Hair Removal Spray', 'Gentle foam spray that removes unwanted hair in 5 minutes without pain. Aloe vera infused to soothe skin instantly.', 990, 2200, ARRAY['/images/hair-removal-1.jpg','/images/hair-removal-2.jpg'], ARRAY['White','Green'], 200, 4.6, 5620, true, 'hair-removal-spray'),
  ('Sensitive Skin Hair Removal Mousse', 'Dermatologist-tested mousse formulated for sensitive skin. Leaves skin silky smooth for up to 2 weeks.', 1250, 2500, ARRAY['/images/hair-removal-2.jpg'], ARRAY['Unscented','Rose'], 140, 4.5, 1320, false, 'hair-removal-spray'),
  ('Pro Nail Polish Thinner 60ml', 'Restores thick, dried-out nail polish back to smooth, brushable consistency without changing the shade.', 550, 1100, ARRAY['/images/nail-1.jpg','/images/nail-2.jpg'], ARRAY['60ml','120ml'], 300, 4.7, 4110, true, 'nail-polish-thinner'),
  ('Nail Care Restore Kit', 'Thinner, cuticle oil and buffer in one kit — everything needed for a salon-finish manicure at home.', 1390, 2700, ARRAY['/images/nail-2.jpg'], ARRAY['Standard','Deluxe'], 70, 4.8, 860, false, 'nail-polish-thinner'),
  ('Hydrating Sheet Mask (10 Pack)', 'Ten serum-drenched sheet masks for deep hydration and instant glow. Suitable for all skin types.', 1150, 2300, ARRAY['/images/mask-1.jpg','/images/mask-2.jpg'], ARRAY['Aloe','Vitamin C','Collagen'], 250, 4.9, 7830, true, 'face-masks'),
  ('Charcoal Peel-Off Mask', 'Deep-cleansing charcoal peel-off mask that lifts blackheads and tightens pores in one use.', 890, 1800, ARRAY['/images/mask-2.jpg'], ARRAY['100g','200g'], 180, 4.6, 2940, false, 'face-masks'),
  ('Gold Glow Clay Mask', 'Brightening clay mask with 24k gold flakes for a radiant, event-ready glow.', 1590, 3200, ARRAY['/images/mask-1.jpg'], ARRAY['Single','Twin Pack'], 60, 4.8, 640, false, 'face-masks'),
  ('Silk Body Butter 250ml', 'Whipped body butter with shea and almond oil. Absorbs fast, leaves a soft satin finish.', 1090, 2100, ARRAY['/images/care-1.jpg','/images/care-2.jpg'], ARRAY['Vanilla','Coconut','Rose'], 160, 4.7, 1750, true, 'personal-care'),
  ('Everyday Essentials Care Set', 'Face wash, moisturiser and lip balm bundle — the complete daily personal care routine in one box.', 1990, 3900, ARRAY['/images/care-2.jpg','/images/care-1.jpg'], ARRAY['Normal Skin','Dry Skin','Oily Skin'], 90, 4.9, 1180, true, 'personal-care')
) AS seed(name, description, price, compare_at_price, images, variants, stock, rating, sold_count, is_featured, cat_slug)
JOIN public.categories c ON c.slug = seed.cat_slug;