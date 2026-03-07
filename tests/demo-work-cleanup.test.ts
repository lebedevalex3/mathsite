import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@/src/lib/db/prisma";
import { cleanupExpiredDemoWorks, maybeCleanupExpiredDemoWorks } from "@/src/lib/demo-work-cleanup";

test("cleanupExpiredDemoWorks deletes expired demo works and orphan variants", async () => {
  const db = prisma as unknown as {
    work: {
      findMany(args: unknown): Promise<Array<{ id: string }>>;
      deleteMany(args: unknown): Promise<{ count: number }>;
    };
    workVariant: {
      findMany(args: unknown): Promise<Array<{ variantId: string }>>;
      findFirst(args: unknown): Promise<{ id: string } | null>;
    };
    variant: {
      deleteMany(args: unknown): Promise<{ count: number }>;
    };
  };

  const originalWorkFindMany = db.work.findMany;
  const originalWorkDeleteMany = db.work.deleteMany;
  const originalWorkVariantFindMany = db.workVariant.findMany;
  const originalWorkVariantFindFirst = db.workVariant.findFirst;
  const originalVariantDeleteMany = db.variant.deleteMany;

  db.work.findMany = async () => [{ id: "work-1" }, { id: "work-2" }];
  db.work.deleteMany = async () => ({ count: 2 });
  db.workVariant.findMany = async () => [{ variantId: "variant-1" }, { variantId: "variant-2" }];
  db.workVariant.findFirst = async (args) =>
    (args as { where: { variantId: string } }).where.variantId === "variant-1" ? null : { id: "link-2" };
  db.variant.deleteMany = async (args) => {
    assert.deepEqual((args as { where: { id: { in: string[] } } }).where.id.in, ["variant-1"]);
    return { count: 1 };
  };

  try {
    const result = await cleanupExpiredDemoWorks(new Date("2026-03-07T10:00:00.000Z"));
    assert.deepEqual(result, {
      skipped: false,
      deletedWorks: 2,
      deletedVariants: 1,
    });
  } finally {
    db.work.findMany = originalWorkFindMany;
    db.work.deleteMany = originalWorkDeleteMany;
    db.workVariant.findMany = originalWorkVariantFindMany;
    db.workVariant.findFirst = originalWorkVariantFindFirst;
    db.variant.deleteMany = originalVariantDeleteMany;
  }
});

test("maybeCleanupExpiredDemoWorks throttles repeated cleanup runs", async () => {
  const state = globalThis as {
    __mathsiteDemoCleanupState?: {
      lastFinishedAt: number;
      running: Promise<unknown> | null;
    };
  };
  state.__mathsiteDemoCleanupState = undefined;

  const db = prisma as unknown as {
    work: {
      findMany(args: unknown): Promise<Array<{ id: string }>>;
      deleteMany(args: unknown): Promise<{ count: number }>;
    };
    workVariant: {
      findMany(args: unknown): Promise<Array<{ variantId: string }>>;
      findFirst(args: unknown): Promise<{ id: string } | null>;
    };
    variant: {
      deleteMany(args: unknown): Promise<{ count: number }>;
    };
  };

  const originalWorkFindMany = db.work.findMany;
  const originalWorkDeleteMany = db.work.deleteMany;
  const originalWorkVariantFindMany = db.workVariant.findMany;
  const originalWorkVariantFindFirst = db.workVariant.findFirst;
  const originalVariantDeleteMany = db.variant.deleteMany;
  let findManyCalls = 0;

  db.work.findMany = async () => {
    findManyCalls += 1;
    return [];
  };
  db.work.deleteMany = async () => ({ count: 0 });
  db.workVariant.findMany = async () => [];
  db.workVariant.findFirst = async () => null;
  db.variant.deleteMany = async () => ({ count: 0 });

  try {
    const now = new Date("2026-03-07T10:00:00.000Z");
    const first = await maybeCleanupExpiredDemoWorks(now);
    const second = await maybeCleanupExpiredDemoWorks(new Date(now.getTime() + 60_000));

    assert.equal(first.skipped, false);
    assert.equal(second.skipped, true);
    assert.equal(findManyCalls, 1);
  } finally {
    db.work.findMany = originalWorkFindMany;
    db.work.deleteMany = originalWorkDeleteMany;
    db.workVariant.findMany = originalWorkVariantFindMany;
    db.workVariant.findFirst = originalWorkVariantFindFirst;
    db.variant.deleteMany = originalVariantDeleteMany;
    state.__mathsiteDemoCleanupState = undefined;
  }
});
