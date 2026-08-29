import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  adminDeleteTab,
  adminListTabs,
  adminReorderTabs,
  adminSaveTab,
} from "@/lib/admin.functions";

export type TabRow = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  commission_percent: number | string;
};

/** Master-admin control over storefront tabs: create, delete, commission, ordering. */
export function StorefrontTabsPanel({
  password,
  onTabsChange,
}: {
  password: string;
  onTabsChange?: (tabs: TabRow[]) => void;
}) {
  const listTabs = useServerFn(adminListTabs);
  const saveTab = useServerFn(adminSaveTab);
  const deleteTab = useServerFn(adminDeleteTab);
  const reorderTabs = useServerFn(adminReorderTabs);

  const [tabs, setTabs] = useState<TabRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✨");

  const refresh = useCallback(async () => {
    const data = await listTabs({ data: { password } });
    const rows = data.tabs as TabRow[];
    setTabs(rows);
    onTabsChange?.(rows);
  }, [listTabs, password, onTabsChange]);

  useEffect(() => {
    void refresh().catch(() => toast.error("Could not load tabs"));
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

  const move = (index: number, delta: number) => {
    const next = [...tabs];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row!);
    setTabs(next);
    void run(() => reorderTabs({ data: { password, ids: next.map((t) => t.id) } }), "Order saved");
  };

  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-2xl bg-card p-4 card-shadow">
        <h2 className="text-sm font-bold">Create a tab</h2>
        <div className="grid grid-cols-[1fr_72px] gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tab name</Label>
            <Input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Icon</Label>
            <Input value={icon} maxLength={4} onChange={(e) => setIcon(e.target.value)} />
          </div>
        </div>
        <Button
          className="w-full brand-gradient text-primary-foreground"
          disabled={busy || name.trim().length === 0}
          onClick={() => {
            const slug = name
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");
            void run(
              () =>
                saveTab({
                  data: {
                    password,
                    tab: {
                      name: name.trim(),
                      slug: slug || `tab-${Date.now()}`,
                      icon: icon.trim() || "✨",
                      sort_order: tabs.length,
                      is_active: true,
                      commission_percent: 0,
                    },
                  },
                }),
              "Tab created",
            );
            setName("");
          }}
        >
          <Plus className="size-4" /> Add tab
        </Button>
      </div>

      <ul className="space-y-2">
        {tabs.map((tab, index) => (
          <li key={tab.id} className="rounded-2xl bg-card p-3 card-shadow">
            <div className="flex items-center gap-2">
              <span className="text-lg">{tab.icon}</span>
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">{tab.name}</p>
              <Switch
                checked={tab.is_active}
                aria-label="Visible in storefront"
                onCheckedChange={(value) =>
                  void run(
                    () =>
                      saveTab({
                        data: {
                          password,
                          tab: {
                            id: tab.id,
                            name: tab.name,
                            slug: tab.slug,
                            icon: tab.icon,
                            sort_order: tab.sort_order,
                            is_active: value,
                            commission_percent: Number(tab.commission_percent) || 0,
                          },
                        },
                      }),
                    value ? "Tab shown" : "Tab hidden",
                  )
                }
              />
              <Button
                size="icon"
                variant="outline"
                aria-label="Delete tab"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm(`Delete tab “${tab.name}”?`)) return;
                  void run(() => deleteTab({ data: { password, id: tab.id } }), "Tab deleted");
                }}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label="Move up"
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label="Move down"
                  disabled={busy || index === tabs.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label="Move left"
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label="Move right"
                  disabled={busy || index === tabs.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowRight className="size-4" />
                </Button>
              </div>

              <label className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                Commission %
                <Input
                  className="h-8 w-16"
                  inputMode="decimal"
                  defaultValue={String(Number(tab.commission_percent) || 0)}
                  onBlur={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isNaN(value) || value === Number(tab.commission_percent)) return;
                    void run(
                      () =>
                        saveTab({
                          data: {
                            password,
                            tab: {
                              id: tab.id,
                              name: tab.name,
                              slug: tab.slug,
                              icon: tab.icon,
                              sort_order: tab.sort_order,
                              is_active: tab.is_active,
                              commission_percent: Math.max(0, Math.min(100, value)),
                            },
                          },
                        }),
                      "Commission saved",
                    );
                  }}
                />
              </label>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
