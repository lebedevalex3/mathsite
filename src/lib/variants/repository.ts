import { prisma } from "@/src/lib/db/prisma";

import { loadVariantContentByTaskIds } from "./generator";
import type { VariantDetail } from "./types";

export async function listVariantsForOwner(ownerUserId: string) {
  const db = prisma as unknown as {
    variant: {
      findMany(args: unknown): Promise<
        Array<{
          id: string;
          topicId: string;
          templateId: string;
          title: string;
          seed: string;
          createdAt: Date;
          _count: { tasks: number };
        }>
      >;
    };
  };

  return db.variant.findMany({
    where: { ownerUserId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      topicId: true,
      templateId: true,
      title: true,
      seed: true,
      createdAt: true,
      _count: { select: { tasks: true } },
    },
  });
}

export async function deleteAllVariantsForOwner(ownerUserId: string) {
  const db = prisma as unknown as {
    variant: {
      deleteMany(args: unknown): Promise<{ count: number }>;
    };
  };

  return db.variant.deleteMany({
    where: { ownerUserId },
  });
}

export async function getVariantDetailForOwner(
  variantId: string,
  ownerUserId: string,
): Promise<VariantDetail | null> {
  const db = prisma as unknown as {
    variant: {
      findFirst(args: unknown): Promise<
        | {
            id: string;
            ownerUserId: string;
            topicId: string;
            templateId: string;
            title: string;
            seed: string;
            createdAt: Date;
            tasks: Array<{
              id: string;
              taskId: string;
              sectionLabel: string;
              orderIndex: number;
            }>;
          }
        | null
      >;
    };
  };

  const variant = await db.variant.findFirst({
    where: { id: variantId, ownerUserId },
    include: {
      tasks: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!variant) return null;

  const taskIds = variant.tasks.map((item) => item.taskId);
  const content = await loadVariantContentByTaskIds(variant.topicId, taskIds);
  const contentById = new Map(content.map((task) => [task.id, task]));

  return {
    id: variant.id,
    ownerUserId: variant.ownerUserId,
    topicId: variant.topicId,
    templateId: variant.templateId,
    title: variant.title,
    seed: variant.seed,
    createdAt: variant.createdAt,
    tasks: variant.tasks.map((item: (typeof variant.tasks)[number]) => {
      const task = contentById.get(item.taskId);
      if (!task) {
        throw new Error(`Task content missing for ${item.taskId}`);
      }
      return {
        id: item.id,
        taskId: item.taskId,
        sectionLabel: item.sectionLabel,
        orderIndex: item.orderIndex,
        task,
      };
    }),
  };
}

export async function getWorkDetailForOwner(
  workId: string,
  ownerUserId: string,
): Promise<
  | {
      id: string;
      topicId: string;
      title: string;
      workType: string;
      printProfileJson: unknown;
      isDemo: boolean;
      createdAt: Date;
      variants: Array<{
        id: string;
        orderIndex: number;
        title: string;
        createdAt: Date;
        tasksCount: number;
      }>;
    }
  | null
> {
  const db = prisma as unknown as {
    work: {
      findFirst(args: unknown): Promise<
        | {
            id: string;
            topicId: string;
            title: string;
            workType: string;
            printProfileJson: unknown;
            isDemo: boolean;
            createdAt: Date;
            variants: Array<{
              orderIndex: number;
              variant: {
                id: string;
                title: string;
                createdAt: Date;
                _count: { tasks: number };
              };
            }>;
          }
        | null
      >;
    };
  };

  const work = await db.work.findFirst({
    where: { id: workId, ownerUserId },
    include: {
      variants: {
        orderBy: { orderIndex: "asc" },
        include: {
          variant: {
            select: {
              id: true,
              title: true,
              createdAt: true,
              _count: { select: { tasks: true } },
            },
          },
        },
      },
    },
  });

  if (!work) return null;

  return {
    id: work.id,
    topicId: work.topicId,
    title: work.title,
    workType: work.workType,
    printProfileJson: work.printProfileJson,
    isDemo: work.isDemo,
    createdAt: work.createdAt,
    variants: work.variants.map((item) => ({
      id: item.variant.id,
      orderIndex: item.orderIndex,
      title: item.variant.title,
      createdAt: item.variant.createdAt,
      tasksCount: item.variant._count.tasks,
    })),
  };
}

export async function listRecentWorksForOwner(
  ownerUserId: string,
  options?: { limit?: number; demoOnly?: boolean },
): Promise<
  Array<{
    id: string;
    topicId: string;
    title: string;
    workType: string;
    printProfileJson: unknown;
    isDemo: boolean;
    createdAt: Date;
    variantsCount: number;
  }>
> {
  const limit = Math.max(1, Math.min(options?.limit ?? 10, 50));
  const db = prisma as unknown as {
    work: {
      findMany(args: unknown): Promise<
        Array<{
          id: string;
          topicId: string;
          title: string;
          workType: string;
          printProfileJson: unknown;
          isDemo: boolean;
          createdAt: Date;
          _count: { variants: number };
        }>
      >;
    };
  };

  return db.work.findMany({
    where: {
      ownerUserId,
      ...(options?.demoOnly ? { isDemo: true } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      topicId: true,
      title: true,
      workType: true,
      printProfileJson: true,
      isDemo: true,
      createdAt: true,
      _count: { select: { variants: true } },
    },
  }).then((rows) =>
    rows.map((row) => ({
      id: row.id,
      topicId: row.topicId,
      title: row.title,
      workType: row.workType,
      printProfileJson: row.printProfileJson,
      isDemo: row.isDemo,
      createdAt: row.createdAt,
      variantsCount: row._count.variants,
    })),
  );
}

export async function getWorkVariantIdsForOwner(
  workId: string,
  ownerUserId: string,
): Promise<{ variantIds: string[]; printProfileJson: unknown } | null> {
  const db = prisma as unknown as {
    work: {
      findFirst(args: unknown): Promise<
        | {
            printProfileJson: unknown;
            variants: Array<{ orderIndex: number; variantId: string }>;
          }
        | null
      >;
    };
  };

  const work = await db.work.findFirst({
    where: { id: workId, ownerUserId },
    select: {
      printProfileJson: true,
      variants: {
        orderBy: { orderIndex: "asc" },
        select: { variantId: true, orderIndex: true },
      },
    },
  });

  if (!work) return null;

  return {
    printProfileJson: work.printProfileJson,
    variantIds: work.variants.map((item) => item.variantId),
  };
}

export async function updateWorkProfileForOwner(params: {
  workId: string;
  ownerUserId: string;
  workType: "lesson" | "quiz" | "homework" | "test";
  printProfileJson: unknown;
}): Promise<{ id: string; workType: string; printProfileJson: unknown } | null> {
  const db = prisma as unknown as {
    work: {
      updateMany(args: unknown): Promise<{ count: number }>;
      findFirst(args: unknown): Promise<{ id: string; workType: string; printProfileJson: unknown } | null>;
    };
  };

  const updated = await db.work.updateMany({
    where: { id: params.workId, ownerUserId: params.ownerUserId },
    data: {
      workType: params.workType,
      printProfileJson: params.printProfileJson,
    },
  });

  if (!updated.count) return null;

  return db.work.findFirst({
    where: { id: params.workId, ownerUserId: params.ownerUserId },
    select: {
      id: true,
      workType: true,
      printProfileJson: true,
    },
  });
}
