import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const APP_ROLES = ["admin", "agent", "sales", "delivery", "user"] as const;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertAdmin(context: { supabase: { rpc: (fn: "has_role", args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> }; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || data !== true) throw new Error("Administrator access required");
}

function fallbackEmail(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "")
    .slice(0, 24) || "staff";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${slug}.${suffix}@staff.auravibe.app`;
}

/* ---------------------------------- designations --------------------------------- */

const designationShape = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(60),
  sort_order: z.number().int().min(0).max(999).default(0),
});

export const saveDesignation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => designationShape.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = await admin();
    if (data.id) {
      const { error } = await db
        .from("staff_designations")
        .update({ name: data.name, sort_order: data.sort_order })
        .eq("id", data.id);
      if (error) throw error;
      return { id: data.id };
    }
    const { data: row, error } = await db
      .from("staff_designations")
      .insert({ name: data.name, sort_order: data.sort_order })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id };
  });

export const deleteDesignation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { error } = await db.from("staff_designations").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

/* ------------------------------------- staff ------------------------------------- */

const staffShape = z.object({
  full_name: z.string().trim().min(1).max(120),
  designation: z.string().trim().min(1).max(60),
  password: z.string().min(6).max(200),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  role: z.enum(APP_ROLES).default("user"),
});

export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => staffShape.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = await admin();
    const email = data.email && data.email.length > 0 ? data.email : fallbackEmail(data.full_name);

    const { data: created, error } = await db.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Could not create the account");

    const userId = created.user.id;
    const { error: profileError } = await db.from("profiles").upsert(
      {
        id: userId,
        email,
        full_name: data.full_name,
        phone: data.phone && data.phone.length > 0 ? data.phone : null,
        designation: data.designation,
        must_change_credentials: true,
      },
      { onConflict: "id" },
    );
    if (profileError) throw profileError;

    if (data.role !== "user") {
      await db.from("user_roles").insert({ user_id: userId, role: data.role });
    }

    return { id: userId, email };
  });

export const updateStaffProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        full_name: z.string().trim().min(1).max(120),
        designation: z.string().trim().max(60).default(""),
        phone: z.string().trim().max(40).optional().or(z.literal("")),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { error } = await db
      .from("profiles")
      .update({
        full_name: data.full_name,
        designation: data.designation,
        phone: data.phone && data.phone.length > 0 ? data.phone : null,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export const setStaffPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        password: z.string().min(6).max(200),
        temporary: z.boolean().default(true),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { error } = await db.auth.admin.updateUserById(data.id, { password: data.password });
    if (error) throw new Error(error.message);
    await db.from("profiles").update({ must_change_credentials: data.temporary }).eq("id", data.id);
    return { ok: true as const };
  });

export const deleteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.id === context.userId) throw new Error("You cannot delete your own account");
    const db = await admin();
    const { error } = await db.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    await db.from("profiles").delete().eq("id", data.id);
    return { ok: true as const };
  });
