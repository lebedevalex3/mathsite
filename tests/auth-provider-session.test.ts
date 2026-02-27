import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { prisma } from "@/src/lib/db/prisma";
import {
  createAuthSession,
  destroyAuthSession,
  getAuthenticatedUserFromCookie,
  verifyPassword,
} from "@/src/lib/auth/provider";

type CookieSetCall = {
  name: string;
  value: string;
  maxAge?: number;
};

function createCookieStore(initialToken?: string) {
  const setCalls: CookieSetCall[] = [];
  const store = {
    get(name: string) {
      if (name !== "auth_session" || !initialToken) return undefined;
      return { value: initialToken };
    },
    set(options: {
      name: string;
      value: string;
      maxAge?: number;
    }) {
      setCalls.push({
        name: options.name,
        value: options.value,
        maxAge: options.maxAge,
      });
    },
  };

  return { store, setCalls };
}

function sha256Hex(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

test("createAuthSession stores hashed token and sets httpOnly cookie token", async () => {
  const authSession = prisma.authSession as unknown as {
    create(args: {
      data: {
        userId: string;
        tokenHash: string;
        expiresAt: Date;
      };
    }): Promise<void>;
  };
  const originalCreate = authSession.create;
  const createCalls: Array<{
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }> = [];

  authSession.create = async (args) => {
    createCalls.push(args.data);
  };

  try {
    const { store, setCalls } = createCookieStore();
    await createAuthSession({ userId: "u-session", cookieStore: store });

    assert.equal(createCalls.length, 1);
    assert.equal(setCalls.length, 1);
    const cookie = setCalls[0];
    const data = createCalls[0];

    assert.equal(cookie.name, "auth_session");
    assert.match(cookie.value, /^[a-f0-9]{64}$/);
    assert.equal(data.userId, "u-session");
    assert.equal(data.tokenHash, sha256Hex(cookie.value));
    assert.ok(data.expiresAt.getTime() > Date.now());
  } finally {
    authSession.create = originalCreate;
  }
});

test("getAuthenticatedUserFromCookie returns null for unknown token hash", async () => {
  const authSession = prisma.authSession as unknown as {
    findFirst(args: { where: { tokenHash: string } }): Promise<null>;
  };
  const originalFindFirst = authSession.findFirst;
  const seenTokenHashes: string[] = [];

  authSession.findFirst = async (args) => {
    seenTokenHashes.push(args.where.tokenHash);
    return null;
  };

  try {
    const { store } = createCookieStore("raw-auth-token");
    const user = await getAuthenticatedUserFromCookie(store);
    assert.equal(user, null);
    assert.deepEqual(seenTokenHashes, [sha256Hex("raw-auth-token")]);
  } finally {
    authSession.findFirst = originalFindFirst;
  }
});

test("getAuthenticatedUserFromCookie deletes expired session and returns null", async () => {
  const authSession = prisma.authSession as unknown as {
    findFirst(args: { where: { tokenHash: string } }): Promise<{
      expiresAt: Date;
      user: { id: string; role: "student"; email: string | null };
    }>;
    deleteMany(args: { where: { tokenHash: string } }): Promise<{ count: number }>;
  };
  const originalFindFirst = authSession.findFirst;
  const originalDeleteMany = authSession.deleteMany;
  const deletedTokenHashes: string[] = [];

  authSession.findFirst = async () => ({
    expiresAt: new Date(Date.now() - 1_000),
    user: { id: "u-expired", role: "student", email: null },
  });
  authSession.deleteMany = async (args) => {
    deletedTokenHashes.push(args.where.tokenHash);
    return { count: 1 };
  };

  try {
    const token = "expired-token";
    const { store } = createCookieStore(token);
    const user = await getAuthenticatedUserFromCookie(store);
    assert.equal(user, null);
    assert.deepEqual(deletedTokenHashes, [sha256Hex(token)]);
  } finally {
    authSession.findFirst = originalFindFirst;
    authSession.deleteMany = originalDeleteMany;
  }
});

test("destroyAuthSession clears cookie and deletes session hash", async () => {
  const authSession = prisma.authSession as unknown as {
    deleteMany(args: { where: { tokenHash: string } }): Promise<{ count: number }>;
  };
  const originalDeleteMany = authSession.deleteMany;
  const deletedTokenHashes: string[] = [];

  authSession.deleteMany = async (args) => {
    deletedTokenHashes.push(args.where.tokenHash);
    return { count: 1 };
  };

  try {
    const token = "token-to-destroy";
    const { store, setCalls } = createCookieStore(token);
    await destroyAuthSession(store);

    assert.deepEqual(deletedTokenHashes, [sha256Hex(token)]);
    assert.equal(setCalls.length, 1);
    assert.equal(setCalls[0].name, "auth_session");
    assert.equal(setCalls[0].value, "");
    assert.equal(setCalls[0].maxAge, 0);
  } finally {
    authSession.deleteMany = originalDeleteMany;
  }
});

test("verifyPassword returns false for malformed stored hash", async () => {
  const valid = await verifyPassword("password123", "not-a-scrypt-hash");
  assert.equal(valid, false);
});
