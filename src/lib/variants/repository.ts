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
