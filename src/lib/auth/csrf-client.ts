"use client";

let cachedCsrfToken: string | null = null;
let tokenRequest: Promise<string | null> | null = null;

export async function getCsrfTokenClient() {
  if (cachedCsrfToken) return cachedCsrfToken;
  if (tokenRequest) return tokenRequest;

  tokenRequest = (async () => {
    try {
      const response = await fetch("/api/auth/session", { credentials: "same-origin" });
      const payload = (await response.json().catch(() => null)) as { csrfToken?: unknown } | null;
      const token = typeof payload?.csrfToken === "string" && payload.csrfToken ? payload.csrfToken : null;
      cachedCsrfToken = token;
      return token;
    } catch {
      return null;
    } finally {
      tokenRequest = null;
    }
  })();

  return tokenRequest;
}
