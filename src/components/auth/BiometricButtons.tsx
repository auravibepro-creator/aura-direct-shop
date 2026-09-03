import { useEffect, useState } from "react";
import { Fingerprint, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { biometricsAvailable, loginWithBiometric, registerBiometric } from "@/lib/webauthn-client";

function useBiometricSupport() {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    let alive = true;
    void biometricsAvailable().then((ok) => {
      if (alive) setSupported(ok);
    });
    return () => {
      alive = false;
    };
  }, []);
  return supported;
}

export function BiometricLoginButton({
  scope,
  username,
  disabled,
  label = "Sign in with fingerprint",
  onSuccess,
}: {
  scope: "admin" | "vendor";
  username?: string;
  disabled?: boolean;
  label?: string;
  onSuccess: (result: { password: string; username: string | null }) => void | Promise<void>;
}) {
  const supported = useBiometricSupport();
  const [busy, setBusy] = useState(false);

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2 border-primary/40 text-primary"
      disabled={busy || disabled}
      onClick={async () => {
        setBusy(true);
        try {
          const result = await loginWithBiometric(scope, username);
          await onSuccess(result);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Fingerprint sign-in failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Fingerprint className="size-4" />
      {busy ? "Verifying…" : label}
    </Button>
  );
}

export function BiometricEnrollButton({
  scope,
  username,
  password,
  onDone,
}: {
  scope: "admin" | "vendor";
  username?: string;
  password: string;
  onDone?: () => void | Promise<void>;
}) {
  const supported = useBiometricSupport();
  const [busy, setBusy] = useState(false);

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      disabled={busy || !password}
      onClick={async () => {
        setBusy(true);
        try {
          const label =
            typeof navigator !== "undefined" && /android|iphone|ipad/i.test(navigator.userAgent)
              ? "Mobile device"
              : "This device";
          await registerBiometric(
            scope === "admin"
              ? { scope: "admin", password, label }
              : { scope: "vendor", username: username!, password, label },
          );
          toast.success("Fingerprint login enabled on this device");
          await onDone?.();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not register this device");
        } finally {
          setBusy(false);
        }
      }}
    >
      <ShieldCheck className="size-4" />
      {busy ? "Registering…" : "Enable fingerprint login"}
    </Button>
  );
}
