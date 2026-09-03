import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { BiometricEnrollButton } from "@/components/auth/BiometricButtons";
import { Button } from "@/components/ui/button";
import { webauthnDeleteDevice, webauthnListDevices } from "@/lib/webauthn.functions";

type DeviceRow = {
  id: string;
  scope: string;
  vendor_username: string | null;
  label: string;
  created_at: string;
  last_used_at: string | null;
};

export function BiometricPanel({ password }: { password: string }) {
  const listDevices = useServerFn(webauthnListDevices);
  const deleteDevice = useServerFn(webauthnDeleteDevice);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await listDevices({ data: { password } });
      setDevices(data.devices as DeviceRow[]);
    } catch {
      /* ignore */
    }
  }, [listDevices, password]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section className="rounded-2xl bg-card p-4 card-shadow">
      <h2 className="flex items-center gap-2 font-display text-sm font-bold">
        <Fingerprint className="size-4 text-primary" /> Biometric login
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Register this phone's fingerprint or face unlock so you can open the admin dashboard and
        secret edit mode without typing the password.
      </p>

      <div className="mt-3">
        <BiometricEnrollButton scope="admin" password={password} onDone={refresh} />
      </div>

      <ul className="mt-3 space-y-2">
        {devices.length === 0 ? (
          <li className="text-xs text-muted-foreground">No devices registered yet.</li>
        ) : null}
        {devices.map((device) => (
          <li
            key={device.id}
            className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {device.label}
                <span className="ml-1 font-normal text-muted-foreground">
                  · {device.scope === "admin" ? "Admin" : `Vendor ${device.vendor_username ?? ""}`}
                </span>
              </p>
              <p className="text-muted-foreground">
                {device.last_used_at
                  ? `Last used ${new Date(device.last_used_at).toLocaleString()}`
                  : "Never used"}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              disabled={busy}
              aria-label="Remove device"
              onClick={async () => {
                setBusy(true);
                try {
                  await deleteDevice({ data: { password, id: device.id } });
                  toast.success("Device removed");
                  await refresh();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not remove device");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
