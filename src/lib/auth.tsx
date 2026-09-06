import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "agent" | "sales" | "delivery" | "user";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrator",
  agent: "Support agent",
  sales: "Sales agent",
  delivery: "Delivery rider",
  user: "Customer",
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  designation?: string;
  must_change_credentials?: boolean;
};

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);

  async function loadIdentity(userId: string | undefined) {
    if (!userId) {
      setProfile(null);
      setRoles([]);
      return;
    }
    const [profileRes, rolesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,full_name,phone,avatar_url,designation,must_change_credentials")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((profileRes.data as Profile | null) ?? null);
    setRoles(((rolesRes.data ?? []) as { role: AppRole }[]).map((row) => row.role));
  }

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      void loadIdentity(nextSession?.user.id);
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      await loadIdentity(data.session?.user.id);
      setLoading(false);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      roles,
      hasRole: (role) => roles.includes(role),
      hasAnyRole: (wanted) => wanted.some((role) => roles.includes(role)),
      refresh: async () => {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        await loadIdentity(data.session?.user.id);
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setRoles([]);
      },
    }),
    [loading, session, profile, roles],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

/** Highest-privilege dashboard the given roles unlock. */
export function primaryRole(roles: AppRole[]): AppRole {
  const order: AppRole[] = ["admin", "agent", "sales", "delivery", "user"];
  return order.find((role) => roles.includes(role)) ?? "user";
}
