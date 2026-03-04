import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/src/lib/db/prisma";
import { PASSWORD_RESET_TOKEN_TTL_MS } from "@/src/lib/auth/policy";

function sha256Hex(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function createRawToken() {
  return randomBytes(32).toString("hex");
}

export function buildPasswordResetUrl(token: string, locale: "ru" | "en" | "de") {
  const baseUrl = process.env.APP_BASE_URL?.trim();
  const path = `/${locale}/auth/reset-password?token=${encodeURIComponent(token)}`;
  if (!baseUrl) return path;
  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return path;
  }
}

export async function issuePasswordResetToken(params: { userId: string }) {
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: params.userId,
      usedAt: null,
    },
  });

  const rawToken = createRawToken();
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId: params.userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    rawToken,
    expiresAt,
  };
}

export async function consumePasswordResetToken(rawToken: string) {
  const tokenHash = sha256Hex(rawToken);
  const now = new Date();

  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (!token || token.usedAt || token.expiresAt.getTime() <= now.getTime()) {
    return null;
  }

  const consumed = await prisma.passwordResetToken.updateMany({
    where: {
      id: token.id,
      usedAt: null,
      expiresAt: { gt: now },
    },
    data: { usedAt: now },
  });
  if (consumed.count !== 1) {
    return null;
  }

  return {
    userId: token.userId,
    tokenId: token.id,
  };
}
