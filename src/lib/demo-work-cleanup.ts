import { prisma } from "@/src/lib/db/prisma";
import { DEMO_WORK_TTL_MS } from "@/src/lib/auth/policy";

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

declare global {
  var __mathsiteDemoCleanupState:
    | {
        lastFinishedAt: number;
        running: Promise<DemoCleanupResult> | null;
      }
    | undefined;
}

export type DemoCleanupResult = {
  skipped: boolean;
  deletedWorks: number;
  deletedVariants: number;
};

function getCleanupState() {
  if (!globalThis.__mathsiteDemoCleanupState) {
    globalThis.__mathsiteDemoCleanupState = {
      lastFinishedAt: 0,
      running: null,
    };
  }
  return globalThis.__mathsiteDemoCleanupState;
}

export async function cleanupExpiredDemoWorks(now = new Date()): Promise<DemoCleanupResult> {
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

  const cutoff = new Date(now.getTime() - DEMO_WORK_TTL_MS);
  const expiredWorks = await db.work.findMany({
    where: {
      isDemo: true,
      OR: [{ expiresAt: { lt: now } }, { createdAt: { lt: cutoff } }],
    },
    select: { id: true },
  });

  if (expiredWorks.length === 0) {
    return {
      skipped: false,
      deletedWorks: 0,
      deletedVariants: 0,
    };
  }

  const workIds = expiredWorks.map((item) => item.id);
  const links = await db.workVariant.findMany({
    where: { workId: { in: workIds } },
    select: { variantId: true },
  });
  const candidateVariantIds = [...new Set(links.map((item) => item.variantId))];

  const deletedWorks = await db.work.deleteMany({
    where: { id: { in: workIds } },
  });

  const orphanVariantIds: string[] = [];
  for (const variantId of candidateVariantIds) {
    const stillLinked = await db.workVariant.findFirst({
      where: { variantId },
      select: { id: true },
    });
    if (!stillLinked) orphanVariantIds.push(variantId);
  }

  const deletedVariants =
    orphanVariantIds.length > 0
      ? await db.variant.deleteMany({
          where: { id: { in: orphanVariantIds } },
        })
      : { count: 0 };

  return {
    skipped: false,
    deletedWorks: deletedWorks.count,
    deletedVariants: deletedVariants.count,
  };
}

export async function maybeCleanupExpiredDemoWorks(now = new Date()): Promise<DemoCleanupResult> {
  const state = getCleanupState();
  if (state.running) {
    return state.running;
  }

  if (now.getTime() - state.lastFinishedAt < CLEANUP_INTERVAL_MS) {
    return {
      skipped: true,
      deletedWorks: 0,
      deletedVariants: 0,
    };
  }

  state.running = cleanupExpiredDemoWorks(now)
    .finally(() => {
      state.lastFinishedAt = now.getTime();
      state.running = null;
    });
  return state.running;
}
