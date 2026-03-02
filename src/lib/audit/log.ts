import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@prisma/client";

export async function writeAuditLog(params: {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      payloadJson: params.payload as Prisma.InputJsonValue | undefined,
    },
  });
}
