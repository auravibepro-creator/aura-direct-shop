/** Deterministic password hash used for vendor logins (server side only). */
export async function hashPassword(value: string) {
  const bytes = new TextEncoder().encode(`auravibe:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
