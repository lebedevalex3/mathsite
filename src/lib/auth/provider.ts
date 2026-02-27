import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { prisma } from "@/src/lib/db/prisma";

const scryptAsync = promisify(scrypt);

const AUTH_SESSION_COOKIE = "auth_session";
const AUTH_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

type CookieStoreLike = {
  get(name: string): { value: string } | undefined;
  set(options: {
    name: string;
    value: string;
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
    path?: string;
    maxAge?: number;
  }): void;
};

export type AuthRole = "student" | "teacher" | "admin";

export type AuthUser = {
  id: string;
  role: AuthRole;
  email: string | null;
};

function sha256Hex(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function assertPasswordPolicy(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new Error("PASSWORD_POLICY_VIOLATION");
  }
}

export async function hashPassword(password: string) {
  assertPasswordPolicy(password);
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$v1$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const parts = storedHash.split("$");
  if (parts.length !== 4) return false;
  const [algo, version, salt, expectedHex] = parts;
  if (algo !== "scrypt" || version !== "v1" || !salt || !expectedHex) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

function setSessionCookie(cookieStore: CookieStoreLike, token: string) {
  cookieStore.set({
    name: AUTH_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_SESSION_TTL_SECONDS,
  });
}

function clearSessionCookie(cookieStore: CookieStoreLike) {
  cookieStore.set({
    name: AUTH_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function createAuthSession(params: {
  userId: string;
  cookieStore: CookieStoreLike;
}) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + AUTH_SESSION_TTL_SECONDS * 1000);

  await prisma.authSession.create({
    data: {
      userId: params.userId,
      tokenHash,
      expiresAt,
    },
  });

  setSessionCookie(params.cookieStore, rawToken);
}

export async function destroyAuthSession(cookieStore: CookieStoreLike) {
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  clearSessionCookie(cookieStore);
  if (!token) return;

  await prisma.authSession.deleteMany({
    where: {
      tokenHash: sha256Hex(token),
    },
  });
}

export async function getAuthenticatedUserFromCookie(
  cookieStore: Pick<CookieStoreLike, "get">,
): Promise<AuthUser | null> {
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.authSession.findFirst({
    where: {
      tokenHash: sha256Hex(token),
    },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          role: true,
          email: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.authSession.deleteMany({
      where: { tokenHash: sha256Hex(token) },
    });
    return null;
  }

  return session.user;
}

export async function findUserByEmail(email: string): Promise<AuthUser & { passwordHash: string | null } | null> {
  return prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: {
      id: true,
      role: true,
      email: true,
      passwordHash: true,
    },
  });
}

export async function bindCredentialsToUser(params: {
  userId: string;
  email: string;
  passwordHash: string;
}): Promise<AuthUser> {
  return prisma.user.update({
    where: { id: params.userId },
    data: {
      email: normalizeEmail(params.email),
      passwordHash: params.passwordHash,
    },
    select: {
      id: true,
      role: true,
      email: true,
    },
  });
}

export function sanitizeEmail(email: unknown) {
  return typeof email === "string" ? normalizeEmail(email) : "";
}
