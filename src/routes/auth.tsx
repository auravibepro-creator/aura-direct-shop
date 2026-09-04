import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LogIn, UserPlus } from "lucide-react";

import { ShopHeader } from "@/components/shop/ShopHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Aura Vibe Team & Customer Portal" },
      {
        name: "description",
        content:
          "Sign in to your Aura Vibe account to track orders, or access the admin, sales, support and delivery dashboards.",
      },
      { property: "og:title", content: "Sign in — Aura Vibe Portal" },
      {
        property: "og:description",
        content: "One login for customers, admins, sales agents, support agents and delivery riders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "" });
  const [pendingConfirm, setPendingConfirm] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  async function submit() {
    if (!form.email.trim() || form.password.length < 6) {
      toast.error("Enter an email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin + "/auth",
            data: { full_name: form.fullName.trim(), phone: form.phone.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setPendingConfirm(true);
          toast.success("Account created — check your email to confirm.");
          return;
        }
        toast.success("Welcome to Aura Vibe!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        toast.success("Signed in.");
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not complete sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <ShopHeader title={mode === "signin" ? "Sign in" : "Create account"} showBack />

      <div className="mx-auto mt-4 w-full max-w-md px-3">
        <div className="rounded-2xl bg-card p-4 card-shadow">
          <h1 className="font-display text-lg font-bold">
            {mode === "signin" ? "Welcome back" : "Join Aura Vibe"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            One account for customers and for the admin, sales, support and delivery dashboards.
          </p>

          {pendingConfirm ? (
            <div className="mt-3 rounded-xl border border-success px-3 py-2 text-xs font-semibold text-success">
              Confirmation email sent to {form.email}. Tap the link, then sign in.
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {mode === "signup" ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    maxLength={80}
                    onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                    placeholder="e.g. Zaheer Abbas"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    inputMode="tel"
                    value={form.phone}
                    maxLength={20}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    placeholder="03XX XXXXXXX"
                  />
                </div>
              </>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="At least 6 characters"
                onKeyDown={(event) => {
                  if (event.key === "Enter") void submit();
                }}
              />
            </div>

            <Button
              className="w-full brand-gradient text-primary-foreground"
              disabled={busy}
              onClick={() => void submit()}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : mode === "signin" ? (
                <LogIn className="size-4" />
              ) : (
                <UserPlus className="size-4" />
              )}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>

            <button
              type="button"
              className="w-full text-center text-xs font-semibold text-primary"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setPendingConfirm(false);
              }}
            >
              {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
