import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { prisma } from "@/src/lib/db/prisma";
import { consumePasswordResetToken } from "@/src/lib/auth/password-reset";

function sha256Hex(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

test("consumePasswordResetToken returns null when atomic update did not consume row", async () => {
  const passwordResetToken = prisma.passwordResetToken as unknown as {
    findUnique(args: {
      where: { tokenHash: string };
      select: {
        id: true;
        userId: true;
        expiresAt: true;
        usedAt: true;
      };
    }): Promise<{
      id: string;
      userId: string;
      expiresAt: Date;
      usedAt: Date | null;
    } | null>;
    updateMany(args: {
      where: {
        id: string;
        usedAt: null;
        expiresAt: { gt: Date };
      };
      data: { usedAt: Date };
    }): Promise<{ count: number }>;
  };
  const originalFindUnique = passwordResetToken.findUnique;
  const originalUpdateMany = passwordResetToken.updateMany;
  const seenHashes: string[] = [];

  passwordResetToken.findUnique = async (args) => {
    seenHashes.push(args.where.tokenHash);
    return {
      id: "token-1",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      usedAt: null,
    };
  };
  passwordResetToken.updateMany = async () => ({ count: 0 });

  try {
    const result = await consumePasswordResetToken("raw-token");
    assert.equal(result, null);
    assert.deepEqual(seenHashes, [sha256Hex("raw-token")]);
  } finally {
    passwordResetToken.findUnique = originalFindUnique;
    passwordResetToken.updateMany = originalUpdateMany;
  }
});

test("consumePasswordResetToken returns payload when atomic update consumes token", async () => {
  const passwordResetToken = prisma.passwordResetToken as unknown as {
    findUnique(args: {
      where: { tokenHash: string };
      select: {
        id: true;
        userId: true;
        expiresAt: true;
        usedAt: true;
      };
    }): Promise<{
      id: string;
      userId: string;
      expiresAt: Date;
      usedAt: Date | null;
    } | null>;
    updateMany(args: {
      where: {
        id: string;
        usedAt: null;
        expiresAt: { gt: Date };
      };
      data: { usedAt: Date };
    }): Promise<{ count: number }>;
  };
  const originalFindUnique = passwordResetToken.findUnique;
  const originalUpdateMany = passwordResetToken.updateMany;
  const seenWhere: Array<{
    id: string;
    usedAt: null;
    expiresAtGt: Date;
  }> = [];

  passwordResetToken.findUnique = async () => ({
    id: "token-2",
    userId: "user-2",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    usedAt: null,
  });
  passwordResetToken.updateMany = async (args) => {
    seenWhere.push({
      id: args.where.id,
      usedAt: args.where.usedAt,
      expiresAtGt: args.where.expiresAt.gt,
    });
    return { count: 1 };
  };

  try {
    const result = await consumePasswordResetToken("raw-token-2");
    assert.deepEqual(result, {
      userId: "user-2",
      tokenId: "token-2",
    });
    assert.equal(seenWhere.length, 1);
    assert.equal(seenWhere[0]?.id, "token-2");
    assert.equal(seenWhere[0]?.usedAt, null);
    assert.ok(seenWhere[0]?.expiresAtGt instanceof Date);
  } finally {
    passwordResetToken.findUnique = originalFindUnique;
    passwordResetToken.updateMany = originalUpdateMany;
  }
});
