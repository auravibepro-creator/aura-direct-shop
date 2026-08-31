import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, Trash2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  adminDeleteVendor,
  adminListTabs,
  adminListVendors,
  adminSaveVendor,
} from "@/lib/admin.functions";

type VendorRow = {
  id: string;
  username: string;
  tab_id: string | null;
  is_active: boolean;
};
type TabOption = { id: string; name: string; commission_percent: number | string };

/** Master-admin panel: generate vendor logins restricted to a single storefront tab. */
export function VendorsPanel({ password }: { password: string }) {
  const listVendors = useServerFn(adminListVendors);
  const listTabs = useServerFn(adminListTabs);
  const saveVendor = useServerFn(adminSaveVendor);
  const deleteVendor = useServerFn(adminDeleteVendor);

  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [tabs, setTabs] = useState<TabOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState("");
  const [vendorPassword, setVendorPassword] = useState("");
  const [tabId, setTabId] = useState("");

  const refresh = useCallback(async () => {
    const [vendorData, tabData] = await Promise.all([
      listVendors({ data: { password } }),
      listTabs({ data: { password } }),
    ]);
    setVendors(vendorData.vendors as VendorRow[]);
    setTabs(tabData.tabs as TabOption[]);
  }, [listVendors, listTabs, password]);

  useEffect(() => {
    void refresh().catch(() => toast.error("Could not load vendor accounts"));
  }, [refresh]);

  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await action();
      await refresh();
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-2xl bg-card p-4 card-shadow">
        <h2 className="text-sm font-bold">Create a vendor login</h2>
        <p className="text-[11px] text-muted-foreground">
          Vendors sign in at <span className="font-semibold text-foreground">/vendor</span> and can
          only manage products inside their assigned tab.
        </p>
        <div className="space-y-1.5">
          <Label className="text-xs">Username</Label>
          <Input value={username} maxLength={40} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Password (min 6 characters)</Label>
          <Input
            value={vendorPassword}
            maxLength={200}
            onChange={(e) => setVendorPassword(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Assigned tab</Label>
          <select
            value={tabId}
            onChange={(e) => setTabId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select a tab…</option>
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.name} · {Number(tab.commission_percent) || 0}% commission
              </option>
            ))}
          </select>
        </div>
        <Button
          className="w-full brand-gradient text-primary-foreground"
          disabled={busy || username.trim().length < 3 || vendorPassword.length < 6 || !tabId}
          onClick={() => {
            void run(
              () =>
                saveVendor({
                  data: {
                    password,
                    vendor: {
                      username: username.trim(),
                      password: vendorPassword,
                      tab_id: tabId,
                      is_active: true,
                    },
                  },
                }),
              "Vendor login created",
            );
            setUsername("");
            setVendorPassword("");
          }}
        >
          <UserPlus className="size-4" /> Generate vendor login
        </Button>
      </div>

      <ul className="space-y-2">
        {vendors.map((vendor) => {
          const tab = tabs.find((t) => t.id === vendor.tab_id);
          return (
            <li key={vendor.id} className="rounded-2xl bg-card p-3 card-shadow">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{vendor.username}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {tab ? `${tab.name} · ${Number(tab.commission_percent) || 0}% commission` : "No tab assigned"}
                  </p>
                </div>
                <Switch
                  checked={vendor.is_active}
                  aria-label="Vendor active"
                  onCheckedChange={(value) =>
                    void run(
                      () =>
                        saveVendor({
                          data: {
                            password,
                            vendor: {
                              id: vendor.id,
                              username: vendor.username,
                              tab_id: vendor.tab_id,
                              is_active: value,
                            },
                          },
                        }),
                      value ? "Vendor enabled" : "Vendor disabled",
                    )
                  }
                />
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Reset vendor password"
                  disabled={busy}
                  onClick={() => {
                    const next = window.prompt(`New password for ${vendor.username}`);
                    if (!next || next.length < 6) return;
                    void run(
                      () =>
                        saveVendor({
                          data: {
                            password,
                            vendor: {
                              id: vendor.id,
                              username: vendor.username,
                              password: next,
                              tab_id: vendor.tab_id,
                              is_active: vendor.is_active,
                            },
                          },
                        }),
                      "Password updated",
                    );
                  }}
                >
                  <KeyRound className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Delete vendor"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm(`Delete vendor “${vendor.username}”?`)) return;
                    void run(
                      () => deleteVendor({ data: { password, id: vendor.id } }),
                      "Vendor deleted",
                    );
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
