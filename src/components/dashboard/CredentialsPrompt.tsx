import { useState } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function CredentialsPrompt() {
  const { user, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (password.length < 6) {
      toast.error("Choose a password with at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const payload: { password: string; email?: string } = { password };
      if (email.trim().length > 0) payload.email = email.trim();
      const { error } = await supabase.auth.updateUser(payload);
      if (error) throw error;
      if (user?.id) {
        await supabase.from("profiles").update({ must_change_credentials: false }).eq("id", user.id);
      }
      await refresh();
      toast.success("Your login details are updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-3 mt-3 rounded-2xl border border-primary/30 bg-card p-4 card-shadow">
      <p className="flex items-center gap-2 text-sm font-bold">
        <KeyRound className="size-4 text-primary" /> Set your own password
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        You are signed in with a temporary password. Please choose your own password now (and add your email
        if you want to sign in with it).
      </p>
      <div className="mt-3 space-y-2">
        <div className="space-y-1">
          <Label className="text-[10px]" htmlFor="own-email">
            Email (optional)
          </Label>
          <Input
            id="own-email"
            className="h-9 text-xs"
            type="email"
            placeholder={user?.email ?? ""}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]" htmlFor="own-password">
            New password
          </Label>
          <Input
            id="own-password"
            className="h-9 text-xs"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]" htmlFor="own-password-2">
            Repeat password
          </Label>
          <Input
            id="own-password-2"
            className="h-9 text-xs"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </div>
        <Button className="h-9 w-full text-xs" disabled={busy} onClick={() => void save()}>
          Save my details
        </Button>
      </div>
    </section>
  );
}
