import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { hashPassword } from "@/lib/hash";

const RP_NAME = "Aura Vibe";

const scopeShape = z.enum(["admin", "vendor"]);

const registerBeginShape = z.union([
  z.object({ scope: z.literal("admin"), password: z.string().min(1).max(200) }),
  z.object({
    scope: z.literal("vendor"),
    username: z.string().trim().min(3).max(40),
    password: z.string().min(1).max(200),
  }),
]);

const registerFinishShape = z.object({
  scope: scopeShape,
  username: z.string().trim().max(40).optional(),
  password: z.string().min(1).max(200),
  label: z.string().trim().max(60).optional(),
  response: z.any(),
});

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Derive the relying-party id + expected origin from the incoming request. */
function relyingParty() {
  const request = getRequest();
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? url.host;
  const proto =
    request.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const hostname = host.split(":")[0]!;
  return { rpID: hostname, origin: `${proto}://${host}` };
}

async function assertAdminPassword(password: string) {
  const expected = process.env["ADMIN_PASSWORD"];
  if (!expected) throw new Error("Admin password is not configured");
  if (password !== expected) throw new Error("Incorrect admin password");
}

async function assertVendorPassword(username: string, password: string) {
  const client = await db();
  const { data } = await client
    .from("vendors")
    .select("username, is_active, password_hash")
    .eq("username", username)
    .maybeSingle();
  if (!data || !data.is_active) throw new Error("Invalid vendor login");
  if (data.password_hash !== (await hashPassword(password))) throw new Error("Invalid vendor login");
}

async function saveChallenge(input: {
  challenge: string;
  scope: string;
  purpose: "register" | "login";
  vendor_username?: string | null;
}) {
  const client = await db();
  await client.from("webauthn_challenges").delete().lt("expires_at", new Date().toISOString());
  await client.from("webauthn_challenges").insert({
    challenge: input.challenge,
    scope: input.scope,
    purpose: input.purpose,
    vendor_username: input.vendor_username ?? null,
  });
}

async function consumeChallenge(challenge: string, purpose: "register" | "login") {
  const client = await db();
  const { data } = await client
    .from("webauthn_challenges")
    .select("id, challenge, expires_at")
    .eq("challenge", challenge)
    .eq("purpose", purpose)
    .maybeSingle();
  if (!data) throw new Error("This request expired. Please try again.");
  await client.from("webauthn_challenges").delete().eq("id", data.id);
  if (new Date(data.expires_at).getTime() < Date.now()) {
    throw new Error("This request expired. Please try again.");
  }
}

/** Step 1 of enrolling a fingerprint / face unlock for this device. */
export const webauthnRegisterBegin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registerBeginShape.parse(data))
  .handler(async ({ data }) => {
    const { generateRegistrationOptions } = await import("@simplewebauthn/server");
    const { isoBase64URL } = await import("@simplewebauthn/server/helpers");
    const client = await db();

    if (data.scope === "admin") await assertAdminPassword(data.password);
    else await assertVendorPassword(data.username, data.password);

    const accountName = data.scope === "admin" ? "store-admin" : data.username;
    const existingQuery =
      data.scope === "vendor"
        ? client
            .from("webauthn_credentials")
            .select("credential_id")
            .eq("scope", "vendor")
            .eq("vendor_username", data.username)
        : client
            .from("webauthn_credentials")
            .select("credential_id")
            .eq("scope", "admin")
            .is("vendor_username", null);
    const { data: existing } = await existingQuery;
    void client
      .from("webauthn_credentials")
      .select("credential_id")
      .eq("scope", data.scope);

    const { rpID } = relyingParty();
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID,
      userID: isoBase64URL.toBuffer(isoBase64URL.fromUTF8String(`${data.scope}:${accountName}`)),
      userName: accountName,
      userDisplayName: data.scope === "admin" ? "Aura Vibe admin" : accountName,
      attestationType: "none",
      excludeCredentials: (existing ?? []).map((row) => ({ id: row.credential_id })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
        authenticatorAttachment: "platform",
      },
    });

    await saveChallenge({
      challenge: options.challenge,
      scope: data.scope,
      purpose: "register",
      vendor_username: data.scope === "vendor" ? data.username : null,
    });

    return { options };
  });

/** Step 2 — store the new passkey for this account. */
export const webauthnRegisterFinish = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registerFinishShape.parse(data))
  .handler(async ({ data }) => {
    const { verifyRegistrationResponse } = await import("@simplewebauthn/server");
    const { isoBase64URL } = await import("@simplewebauthn/server/helpers");

    if (data.scope === "admin") await assertAdminPassword(data.password);
    else {
      if (!data.username) throw new Error("Vendor username is required");
      await assertVendorPassword(data.username, data.password);
    }

    const response = data.response as {
      response: { clientDataJSON: string };
    };
    const clientData = JSON.parse(
      new TextDecoder().decode(isoBase64URL.toBuffer(response.response.clientDataJSON)),
    ) as { challenge: string };
    await consumeChallenge(clientData.challenge, "register");

    const { rpID, origin } = relyingParty();
    const verification = await verifyRegistrationResponse({
      response: data.response,
      expectedChallenge: clientData.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
    if (!verification.verified || !verification.registrationInfo) {
      throw new Error("Could not verify this device");
    }

    const credential = verification.registrationInfo.credential;
    const client = await db();
    const { error } = await client.from("webauthn_credentials").upsert(
      {
        scope: data.scope,
        vendor_username: data.scope === "vendor" ? (data.username ?? null) : null,
        credential_id: credential.id,
        public_key: isoBase64URL.fromBuffer(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports ?? [],
        label: data.label?.trim() || "This device",
        secret: data.password,
      },
      { onConflict: "credential_id" },
    );
    if (error) throw error;

    return { ok: true as const };
  });

/** Step 1 of biometric sign-in. */
export const webauthnLoginBegin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({ scope: scopeShape, username: z.string().trim().max(40).optional() })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { generateAuthenticationOptions } = await import("@simplewebauthn/server");
    const client = await db();

    let query = client
      .from("webauthn_credentials")
      .select("credential_id, transports")
      .eq("scope", data.scope);
    query =
      data.scope === "vendor" && data.username
        ? query.eq("vendor_username", data.username)
        : query.is("vendor_username", null);
    const { data: rows } = await query;
    if (!rows || rows.length === 0) {
      throw new Error("No fingerprint is registered for this account yet");
    }

    const { rpID } = relyingParty();
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "required",
      allowCredentials: rows.map((row) => ({
        id: row.credential_id,
        transports: (row.transports ?? []) as never,
      })),
    });

    await saveChallenge({
      challenge: options.challenge,
      scope: data.scope,
      purpose: "login",
      vendor_username: data.scope === "vendor" ? (data.username ?? null) : null,
    });

    return { options };
  });

/** Step 2 — verify the assertion and hand back the account credentials. */
export const webauthnLoginFinish = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ scope: scopeShape, response: z.any() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { verifyAuthenticationResponse } = await import("@simplewebauthn/server");
    const { isoBase64URL } = await import("@simplewebauthn/server/helpers");

    const response = data.response as {
      id: string;
      response: { clientDataJSON: string };
    };
    const clientData = JSON.parse(
      new TextDecoder().decode(isoBase64URL.toBuffer(response.response.clientDataJSON)),
    ) as { challenge: string };
    await consumeChallenge(clientData.challenge, "login");

    const client = await db();
    const { data: row } = await client
      .from("webauthn_credentials")
      .select("*")
      .eq("credential_id", response.id)
      .eq("scope", data.scope)
      .maybeSingle();
    if (!row) throw new Error("This device is not registered");

    const { rpID, origin } = relyingParty();
    const verification = await verifyAuthenticationResponse({
      response: data.response,
      expectedChallenge: clientData.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: row.credential_id,
        publicKey: isoBase64URL.toBuffer(row.public_key),
        counter: Number(row.counter),
        transports: (row.transports ?? []) as never,
      },
    });
    if (!verification.verified) throw new Error("Fingerprint verification failed");

    await client
      .from("webauthn_credentials")
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    // The stored secret is only released after a verified biometric assertion.
    if (data.scope === "admin") {
      await assertAdminPassword(row.secret);
      return { scope: "admin" as const, password: row.secret, username: null };
    }

    if (!row.vendor_username) throw new Error("This device is not registered");
    await assertVendorPassword(row.vendor_username, row.secret);
    return { scope: "vendor" as const, password: row.secret, username: row.vendor_username };
  });

/** List / remove registered devices for the admin account. */
export const webauthnListDevices = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ password: z.string().min(1).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    await assertAdminPassword(data.password);
    const client = await db();
    const { data: rows } = await client
      .from("webauthn_credentials")
      .select("id, scope, vendor_username, label, created_at, last_used_at")
      .order("created_at", { ascending: false });
    return { devices: rows ?? [] };
  });

export const webauthnDeleteDevice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ password: z.string().min(1).max(200), id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    await assertAdminPassword(data.password);
    const client = await db();
    const { error } = await client.from("webauthn_credentials").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });
