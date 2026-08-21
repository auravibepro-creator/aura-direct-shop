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
};

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
