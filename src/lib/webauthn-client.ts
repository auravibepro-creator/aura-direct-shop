import {
  webauthnLoginBegin,
  webauthnLoginFinish,
  webauthnRegisterBegin,
  webauthnRegisterFinish,
} from "@/lib/webauthn.functions";

/** True when this browser/device can do platform biometrics (fingerprint / face). */
export async function biometricsAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    const { platformAuthenticatorIsAvailable } = await import("@simplewebauthn/browser");
    return await platformAuthenticatorIsAvailable();
  } catch {
    return false;
  }
}

function message(error: unknown, fallback: string) {
  if (error instanceof Error) {
    if (error.name === "NotAllowedError") return "Fingerprint check was cancelled";
    if (error.name === "InvalidStateError") return "This device is already registered";
    return error.message || fallback;
  }
  return fallback;
}

export async function registerBiometric(
  input:
    | { scope: "admin"; password: string; label?: string }
    | { scope: "vendor"; username: string; password: string; label?: string },
): Promise<void> {
  const { startRegistration } = await import("@simplewebauthn/browser");
  try {
    const { options } = await webauthnRegisterBegin({ data: input as never });
    const response = await startRegistration({ optionsJSON: options as never });
    await webauthnRegisterFinish({
      data: {
        scope: input.scope,
        username: input.scope === "vendor" ? input.username : undefined,
        password: input.password,
        label: input.label,
        response,
      },
    });
  } catch (error) {
    throw new Error(message(error, "Could not register this device"));
  }
}

export async function loginWithBiometric(
  scope: "admin" | "vendor",
  username?: string,
): Promise<{ password: string; username: string | null }> {
  const { startAuthentication } = await import("@simplewebauthn/browser");
  try {
    const { options } = await webauthnLoginBegin({ data: { scope, username } });
    const response = await startAuthentication({ optionsJSON: options as never });
    const result = await webauthnLoginFinish({ data: { scope, response } });
    return { password: result.password, username: result.username };
  } catch (error) {
    throw new Error(message(error, "Fingerprint sign-in failed"));
  }
}
