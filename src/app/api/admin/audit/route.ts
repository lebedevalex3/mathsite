import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { forbidden, toApiError, unauthorized } from "@/src/lib/api/errors";
import { isAdminRole } from "@/src/lib/auth/access";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";
import { prisma } from "@/src/lib/db/prisma";

export const runtime = "nodejs";

function normalizeQuery(raw: string | null) {
  return (raw ?? "").trim().toLowerCase();
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const user = await getAuthenticatedUserFromCookie(cookieStore);
    if (!user) {
      const { status, body } = unauthorized("Sign-in required.");
      return NextResponse.json(body, { status });
    }
    if (!isAdminRole(user.role)) {
      const { status, body } = forbidden("Admin role required.");
      return NextResponse.json(body, { status });
    }

    const { searchParams } = new URL(request.url);
    const query = normalizeQuery(searchParams.get("q"));
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 80) || 80));

    const rows = await prisma.auditLog.findMany({
      where: query
        ? {
            OR: [
              { action: { contains: query, mode: "insensitive" } },
              { entityType: { contains: query, mode: "insensitive" } },
              { entityId: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        payloadJson: true,
        createdAt: true,
        actorUser: {
          select: {
            id: true,
            role: true,
            email: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      logs: rows.map((item) => ({
        id: item.id,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        payloadJson: item.payloadJson,
        createdAt: item.createdAt.toISOString(),
        actor: item.actorUser
          ? {
              id: item.actorUser.id,
              role: item.actorUser.role,
              email: item.actorUser.email,
              username: item.actorUser.username,
            }
          : null,
      })),
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "ADMIN_AUDIT_LIST_ERROR",
      defaultMessage: "Failed to load audit log.",
    });
    return NextResponse.json(body, { status });
  }
}
