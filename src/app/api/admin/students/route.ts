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
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50) || 50));

    const rows = await prisma.user.findMany({
      where: {
        role: "student",
        ...(query
          ? {
              OR: [
                { username: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        username: true,
        email: true,
        mustChangePassword: true,
        createdAt: true,
        _count: {
          select: {
            classMemberships: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      students: rows.map((item) => ({
        id: item.id,
        username: item.username,
        email: item.email,
        mustChangePassword: item.mustChangePassword,
        createdAt: item.createdAt.toISOString(),
        classesCount: item._count.classMemberships,
      })),
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "ADMIN_STUDENTS_LIST_ERROR",
      defaultMessage: "Failed to load students.",
    });
    return NextResponse.json(body, { status });
  }
}
