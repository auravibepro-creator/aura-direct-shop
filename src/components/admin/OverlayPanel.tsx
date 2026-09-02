import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { adminGetOverlaySettings, adminSaveOverlaySettings } from "@/lib/admin.functions";
import {
  DEFAULT_OVERLAY_SETTINGS,
  normalizeOverlaySettings,
  type OverlaySettings,
} from "@/lib/shop";

export function OverlayPanel({ password }: { password: string }) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<OverlaySettings>(DEFAULT_OVERLAY_SETTINGS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void adminGetOverlaySettings({ data: { password } })
      .then((res) => {
        if (active) setSettings(normalizeOverlaySettings(res.value));
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      active = false;
    };
  }, [password]);

  async function save() {
    setBusy(true);
    try {
      await adminSaveOverlaySettings({ data: { password, settings } });
      await queryClient.invalidateQueries({ queryKey: ["overlay-settings"] });
      toast.success("Overlay settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl bg-card p-4 card-shadow">
      <p className="flex items-center gap-1.5 text-sm font-semibold">
        <EyeOff className="size-4" /> Hide floating overlays
      </p>

      <label className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
        <span className="min-w-0 pr-3 text-xs font-semibold">
          Hide bottom AppsGeyser / ad banner
          <span className="block text-[10px] font-normal text-muted-foreground">
            Removes injected bottom banners in the mobile web view.
          </span>
        </span>
        <Switch
          checked={settings.hide_appsgeyser_banner}
          onCheckedChange={(v) => setSettings((s) => ({ ...s, hide_appsgeyser_banner: v }))}
        />
      </label>

      <label className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
        <span className="min-w-0 pr-3 text-xs font-semibold">
          Hide “Edit with Lovable” badge
          <span className="block text-[10px] font-normal text-muted-foreground">
            Removes the floating editor badge from the interface.
          </span>
        </span>
        <Switch
          checked={settings.hide_lovable_badge}
          onCheckedChange={(v) => setSettings((s) => ({ ...s, hide_lovable_badge: v }))}
        />
      </label>

      <Button
        className="w-full brand-gradient text-primary-foreground"
        disabled={busy}
        onClick={save}
      >
        {busy ? "Saving…" : "Save overlay settings"}
      </Button>
    </div>
  );
}
