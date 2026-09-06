import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Save, ShieldCheck, Trash2, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, type AppRole } from "@/lib/auth";
import {
  createStaff,
  deleteDesignation,
  deleteStaff,
  saveDesignation,
  setStaffPassword,
  updateStaffProfile,
} from "@/lib/staff.functions";

type Designation = { id: string; name: string; sort_order: number };

type TeamMember = {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  designation: string;
  must_change_credentials: boolean;
  roles: AppRole[];
  settings: {
    base_salary: number;
    commission_percent: number;
    monthly_target: number;
    is_active: boolean;
  } | null;
};

const ASSIGNABLE: AppRole[] = ["admin", "agent", "sales", "delivery", "user"];

async function fetchTeam(): Promise<TeamMember[]> {
  const [profilesRes, rolesRes, settingsRes] = await Promise.all([
    supabase.from("profiles").select("id,email,full_name,phone").order("created_at", { ascending: true }),
    supabase.from("user_roles").select("user_id,role"),
    supabase.from("staff_settings").select("user_id,base_salary,commission_percent,monthly_target,is_active"),
  ]);
  if (profilesRes.error) throw profilesRes.error;

  const roleMap = new Map<string, AppRole[]>();
  for (const row of (rolesRes.data ?? []) as { user_id: string; role: AppRole }[]) {
    roleMap.set(row.user_id, [...(roleMap.get(row.user_id) ?? []), row.role]);
  }
  const settingsMap = new Map<string, TeamMember["settings"]>();
  for (const row of (settingsRes.data ?? []) as (NonNullable<TeamMember["settings"]> & { user_id: string })[]) {
    settingsMap.set(row.user_id, {
      base_salary: Number(row.base_salary),
      commission_percent: Number(row.commission_percent),
      monthly_target: Number(row.monthly_target),
      is_active: row.is_active,
    });
  }

  return ((profilesRes.data ?? []) as Omit<TeamMember, "roles" | "settings">[]).map((profile) => ({
    ...profile,
    roles: roleMap.get(profile.id) ?? [],
    settings: settingsMap.get(profile.id) ?? null,
  }));
}

export function AdminTeamPanel() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["team"], queryFn: fetchTeam });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { salary: string; commission: string; target: string }>>({});

  async function toggleRole(member: TeamMember, role: AppRole, enabled: boolean) {
    setBusyId(member.id);
    try {
      if (enabled) {
        const { error } = await supabase.from("user_roles").insert({ user_id: member.id, role });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", member.id)
          .eq("role", role);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success(`${ROLE_LABELS[role]} ${enabled ? "granted" : "removed"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update access.");
    } finally {
      setBusyId(null);
    }
  }

  async function savePay(member: TeamMember) {
    const draft = drafts[member.id] ?? {
      salary: String(member.settings?.base_salary ?? 0),
      commission: String(member.settings?.commission_percent ?? 0),
      target: String(member.settings?.monthly_target ?? 0),
    };
    setBusyId(member.id);
    try {
      const { error } = await supabase.from("staff_settings").upsert(
        {
          user_id: member.id,
          base_salary: Number(draft.salary) || 0,
          commission_percent: Math.max(0, Math.min(100, Number(draft.commission) || 0)),
          monthly_target: Number(draft.target) || 0,
          is_active: member.settings?.is_active ?? true,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("Package saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save package.");
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-card p-4 text-xs text-muted-foreground card-shadow">
        <Loader2 className="size-4 animate-spin" /> Loading team…
      </p>
    );
  }

  const members = data ?? [];

  return (
    <section className="space-y-2">
      <div className="rounded-xl bg-card p-3 text-[11px] text-muted-foreground card-shadow">
        Everyone who signs up appears here. Switch on the roles they need, then set salary, commission and
        monthly target for sales and delivery staff.
      </div>

      {members.map((member) => {
        const draft = drafts[member.id] ?? {
          salary: String(member.settings?.base_salary ?? 0),
          commission: String(member.settings?.commission_percent ?? 0),
          target: String(member.settings?.monthly_target ?? 0),
        };
        const setDraft = (patch: Partial<typeof draft>) =>
          setDrafts((prev) => ({ ...prev, [member.id]: { ...draft, ...patch } }));

        return (
          <article key={member.id} className="rounded-2xl bg-card p-3 card-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{member.full_name || "Unnamed"}</p>
                <p className="truncate text-[11px] text-muted-foreground">{member.email}</p>
                {member.phone ? <p className="text-[11px] text-muted-foreground">{member.phone}</p> : null}
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                {member.roles.map((role) => (
                  <Badge key={role} className="bg-primary/15 text-primary">
                    {ROLE_LABELS[role]}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-1.5 border-t border-border pt-2">
              {ASSIGNABLE.map((role) => (
                <label key={role} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-muted-foreground" />
                    {ROLE_LABELS[role]}
                  </span>
                  <Switch
                    checked={member.roles.includes(role)}
                    disabled={busyId === member.id}
                    onCheckedChange={(checked) => void toggleRole(member, role, checked)}
                    aria-label={`${ROLE_LABELS[role]} for ${member.email ?? member.id}`}
                  />
                </label>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-2">
              <div className="space-y-1">
                <Label className="text-[10px]" htmlFor={`salary-${member.id}`}>
                  Base salary
                </Label>
                <Input
                  id={`salary-${member.id}`}
                  className="h-8 text-xs"
                  inputMode="decimal"
                  value={draft.salary}
                  onChange={(event) => setDraft({ salary: event.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]" htmlFor={`commission-${member.id}`}>
                  Commission %
                </Label>
                <Input
                  id={`commission-${member.id}`}
                  className="h-8 text-xs"
                  inputMode="decimal"
                  value={draft.commission}
                  onChange={(event) => setDraft({ commission: event.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]" htmlFor={`target-${member.id}`}>
                  Monthly target
                </Label>
                <Input
                  id={`target-${member.id}`}
                  className="h-8 text-xs"
                  inputMode="decimal"
                  value={draft.target}
                  onChange={(event) => setDraft({ target: event.target.value })}
                />
              </div>
            </div>

            <Button
              size="sm"
              className="mt-2 h-8 w-full text-[11px]"
              disabled={busyId === member.id}
              onClick={() => void savePay(member)}
            >
              <Save className="size-3.5" /> Save package
            </Button>
          </article>
        );
      })}
    </section>
  );
}
