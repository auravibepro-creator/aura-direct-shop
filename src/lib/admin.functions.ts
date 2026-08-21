import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const passwordShape = z.object({ password: z.string().min(1).max(200) });

const productShape = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).default(""),
  price: z.number().min(0).max(10_000_000),
  compare_at_price: z.number().min(0).max(10_000_000).nullable().default(null),
  images: z.array(z.string().trim().max(1000)).max(10).default([]),
  video_url: z.string().trim().max(1000).nullable().default(null),
  variants: z.array(z.string().trim().max(80)).max(20).default([]),
  stock: z.number().int().min(0).max(1_000_000).default(100),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  category_id: z.string().uuid().nullable().default(null),
});

const categoryShape = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  icon: z.string().trim().min(1).max(8).default("✨"),
  is_hot: z.boolean().default(false),
  sort_order: z.number().int().min(0).max(999).default(0),
});

function assertPassword(password: string) {
  const expected = process.env["ADMIN_PASSWORD"];
  if (!expected) throw new Error("Admin password is not configured");
  if (password !== expected) throw new Error("Incorrect admin password");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => passwordShape.parse(data))
  .handler(async ({ data }) => {
    assertPassword(data.password);
    return { ok: true as const };
  });

export const adminListAll = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => passwordShape.parse(data))
  .handler(async ({ data }) => {
    assertPassword(data.password);
    const db = await admin();
    const [products, categories, announcements] = await Promise.all([
      db.from("products").select("*").order("created_at", { ascending: false }),
      db.from("categories").select("*").order("sort_order", { ascending: true }),
      db.from("announcements").select("*").order("sort_order", { ascending: true }),
    ]);
    if (products.error) throw products.error;
    if (categories.error) throw categories.error;
    if (announcements.error) throw announcements.error;
    return {
      products: products.data ?? [],
      categories: categories.data ?? [],
      announcements: announcements.data ?? [],
    };
  });

export const adminSaveProduct = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => passwordShape.extend({ product: productShape }).parse(data))
  .handler(async ({ data }) => {
    assertPassword(data.password);
    const db = await admin();
    const { id, ...fields } = data.product;
    const { error } = id
      ? await db.from("products").update(fields).eq("id", id)
      : await db.from("products").insert(fields);
    if (error) throw error;
    return { ok: true as const };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => passwordShape.extend({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    assertPassword(data.password);
    const db = await admin();
    const { error } = await db.from("products").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export const adminSaveCategory = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => passwordShape.extend({ category: categoryShape }).parse(data))
  .handler(async ({ data }) => {
    assertPassword(data.password);
    const db = await admin();
    const { id, ...fields } = data.category;
    const { error } = id
      ? await db.from("categories").update(fields).eq("id", id)
      : await db.from("categories").insert(fields);
    if (error) throw error;
    return { ok: true as const };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => passwordShape.extend({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    assertPassword(data.password);
    const db = await admin();
    const { error } = await db.from("categories").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export const adminSaveAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    passwordShape
      .extend({
        announcement: z.object({
          id: z.string().uuid().optional(),
          message: z.string().trim().min(1).max(240),
          is_active: z.boolean().default(true),
          sort_order: z.number().int().min(0).max(999).default(0),
        }),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    assertPassword(data.password);
    const db = await admin();
    const { id, ...fields } = data.announcement;
    const { error } = id
      ? await db.from("announcements").update(fields).eq("id", id)
      : await db.from("announcements").insert(fields);
    if (error) throw error;
    return { ok: true as const };
  });

export const adminDeleteAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => passwordShape.extend({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    assertPassword(data.password);
    const db = await admin();
    const { error } = await db.from("announcements").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });
