import assert from "node:assert/strict";
import test from "node:test";

import {
  CSRF_COOKIE_NAME,
  getOrCreateCsrfToken,
  verifyCsrfRequest,
} from "@/src/lib/auth/csrf";

function makeCookieStore(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const setCalls: Array<{ name: string; value: string; httpOnly?: boolean }> = [];
  return {
    store: {
      get(name: string) {
        const value = values.get(name);
        return value ? { value } : undefined;
      },
      set(options: { name: string; value: string; httpOnly?: boolean }) {
        values.set(options.name, options.value);
        setCalls.push(options);
      },
    },
    setCalls,
  };
}

test("getOrCreateCsrfToken reuses existing cookie token", () => {
  const { store, setCalls } = makeCookieStore({ [CSRF_COOKIE_NAME]: "existing-token" });
  const token = getOrCreateCsrfToken(store);
  assert.equal(token, "existing-token");
  assert.equal(setCalls.length, 0);
});

test("getOrCreateCsrfToken creates token cookie when missing", () => {
  const { store, setCalls } = makeCookieStore();
  const token = getOrCreateCsrfToken(store);
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.equal(setCalls.length, 1);
  assert.equal(setCalls[0]?.name, CSRF_COOKIE_NAME);
  assert.equal(setCalls[0]?.httpOnly, true);
});

test("verifyCsrfRequest allows safe methods", () => {
  const { store } = makeCookieStore();
  const request = new Request("http://localhost:3000/api/auth/session", {
    method: "GET",
  });
  const error = verifyCsrfRequest(request, store);
  assert.equal(error, null);
});

test("verifyCsrfRequest rejects missing token for POST", () => {
  const { store } = makeCookieStore();
  const request = new Request("http://localhost:3000/api/auth/sign-in", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
    },
  });
  const error = verifyCsrfRequest(request, store);
  assert.ok(error);
  assert.equal(error?.status, 403);
  assert.equal(error?.body.code, "CSRF_INVALID");
});

test("verifyCsrfRequest rejects origin mismatch", () => {
  const { store } = makeCookieStore({ [CSRF_COOKIE_NAME]: "abc" });
  const request = new Request("http://localhost:3000/api/auth/sign-in", {
    method: "POST",
    headers: {
      origin: "http://evil.local",
      "x-csrf-token": "abc",
    },
  });
  const error = verifyCsrfRequest(request, store);
  assert.ok(error);
  assert.equal(error?.status, 403);
  assert.equal(error?.body.code, "CSRF_INVALID");
});

test("verifyCsrfRequest accepts matching token and origin", () => {
  const { store } = makeCookieStore({ [CSRF_COOKIE_NAME]: "token-1" });
  const request = new Request("http://localhost:3000/api/auth/sign-out", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      "x-csrf-token": "token-1",
    },
  });
  const error = verifyCsrfRequest(request, store);
  assert.equal(error, null);
});
