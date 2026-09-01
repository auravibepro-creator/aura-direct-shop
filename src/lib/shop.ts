import { supabase } from "@/integrations/supabase/client";

export const WHATSAPP_NUMBER = "923080841880";
export const FREE_SHIPPING_THRESHOLD = 2500;

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image_url: string | null;
  is_hot: boolean;
  sort_order: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  video_url: string | null;
  variants: string[];
  stock: number;
  rating: number;
  sold_count: number;
  is_featured: boolean;
  is_active: boolean;
  category_id: string | null;
  tab_id?: string | null;
};

export type Tab = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  commission_percent: number;
};

export async function fetchTabs(): Promise<Tab[]> {
  const { data, error } = await supabase
    .from("tabs")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row as unknown as Tab),
    commission_percent: Number((row as Record<string, unknown>)["commission_percent"] ?? 0),
  }));
}

export function formatPKR(amount: number) {
  return `Rs. ${Math.round(amount).toLocaleString("en-PK")}`;
}

export function discountPercent(product: Pick<Product, "price" | "compare_at_price">) {
  if (!product.compare_at_price || product.compare_at_price <= product.price) return null;
  return Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100);
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown[]).map(normalizeProduct);
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? normalizeProduct(data) : null;
}

export async function fetchAnnouncements(): Promise<string[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("message, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => row.message as string);
}

export function normalizeProduct(row: unknown): Product {
  const r = row as Record<string, unknown>;
  return {
    ...(r as unknown as Product),
    price: Number(r["price"] ?? 0),
    compare_at_price: r["compare_at_price"] == null ? null : Number(r["compare_at_price"]),
    rating: Number(r["rating"] ?? 0),
    images: (r["images"] as string[]) ?? [],
    variants: (r["variants"] as string[]) ?? [],
  };
}

/* ---------- Ticker style (admin-controlled) ---------- */

export type TickerStyle = {
  enabled: boolean;
  height: number;
  font_size: number;
  speed: number;
  gap: number;
  bold: boolean;
  bg_from: string;
  bg_to: string;
  text_color: string;
};

export const DEFAULT_TICKER_STYLE: TickerStyle = {
  enabled: true,
  height: 26,
  font_size: 12,
  speed: 22,
  gap: 40,
  bold: true,
  bg_from: "#e23c1f",
  bg_to: "#f07a20",
  text_color: "#ffffff",
};

export function normalizeTickerStyle(value: unknown): TickerStyle {
  const v = (value ?? {}) as Record<string, unknown>;
  const num = (key: keyof TickerStyle, min: number, max: number) => {
    const n = Number(v[key]);
    if (!Number.isFinite(n)) return DEFAULT_TICKER_STYLE[key] as number;
    return Math.min(max, Math.max(min, n));
  };
  const color = (key: keyof TickerStyle) =>
    typeof v[key] === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v[key] as string)
      ? (v[key] as string)
      : (DEFAULT_TICKER_STYLE[key] as string);
  return {
    enabled: v["enabled"] == null ? true : Boolean(v["enabled"]),
    height: num("height", 16, 80),
    font_size: num("font_size", 9, 28),
    speed: num("speed", 5, 120),
    gap: num("gap", 8, 120),
    bold: v["bold"] == null ? true : Boolean(v["bold"]),
    bg_from: color("bg_from"),
    bg_to: color("bg_to"),
    text_color: color("text_color"),
  };
}

export async function fetchTickerStyle(): Promise<TickerStyle> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "ticker_style")
    .maybeSingle();
  if (error) throw error;
  return normalizeTickerStyle((data as { value?: unknown } | null)?.value);
}
