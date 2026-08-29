import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { hashPassword } from "@/lib/hash";

const credentials = z.object({
  username: z.string().trim().min(3).max(40),
  password: z.string().min(1).max(200),
});

const vendorProductShape = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).default(""),
  price: z.number().min(0).max(10_000_000),
  compare_at_price: z.number().min(0).max(10_000_000).nullable().default(null),
  images: z.array(z.string().trim().max(2_000_000)).max(10).default([]),
  video_url: z.string().trim().max(1000).nullable().default(null),
  variants: z.array(z.string().trim().max(80)).max(20).default([]),
  stock: z.number().int().min(0).max(1_000_000).default(100),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

async function authenticate(username: string, password: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("vendors")
    .select("id, username, tab_id, is_active, password_hash")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.is_active) throw new Error("Invalid vendor login");
  const expected = await hashPassword(password);
  if (data.password_hash !== expected) throw new Error("Invalid vendor login");
  if (!data.tab_id) throw new Error("This vendor account has no category assigned yet");
  return { db: supabaseAdmin, vendor: data };
}

export const vendorLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credentials.parse(data))
  .handler(async ({ data }) => {
    const { db, vendor } = await authenticate(data.username, data.password);
    const { data: tab } = await db
      .from("tabs")
      .select("id, name, commission_percent")
      .eq("id", vendor.tab_id!)
      .maybeSingle();
    return { username: vendor.username, tab: tab ?? null };
  });

export const vendorListProducts = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credentials.parse(data))
  .handler(async ({ data }) => {
    const { db, vendor } = await authenticate(data.username, data.password);
    const { data: rows, error } = await db
      .from("products")
      .select("*")
      .eq("tab_id", vendor.tab_id!)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { products: rows ?? [] };
  });

export const vendorSaveProduct = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    credentials.extend({ product: vendorProductShape }).parse(data),
  )
  .handler(async ({ data }) => {
    const { db, vendor } = await authenticate(data.username, data.password);
    const { id, ...fields } = data.product;
    if (id) {
      // Vendors may only touch products inside their own category.
      const { data: owned } = await db
        .from("products")
        .select("id")
        .eq("id", id)
        .eq("tab_id", vendor.tab_id!)
        .maybeSingle();
      if (!owned) throw new Error("You can only edit products in your own category");
      const { error } = await db.from("products").update(fields).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await db.from("products").insert({ ...fields, tab_id: vendor.tab_id });
      if (error) throw error;
    }
    return { ok: true as const };
  });

export const vendorDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credentials.extend({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { db, vendor } = await authenticate(data.username, data.password);
    const { error } = await db
      .from("products")
      .delete()
      .eq("id", data.id)
      .eq("tab_id", vendor.tab_id!);
    if (error) throw error;
    return { ok: true as const };
  });
