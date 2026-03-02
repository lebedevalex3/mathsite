import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, forbidden, toApiError, unauthorized } from "@/src/lib/api/errors";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";
import { isTeacherRole } from "@/src/lib/auth/access";
import { prisma } from "@/src/lib/db/prisma";
import { writeAuditLog } from "@/src/lib/audit/log";
import { generateUniqueJoinCode } from "@/src/lib/classrooms/credentials";

export const runtime = "nodejs";

type CreateClassPayload = {
  name?: unknown;
};

function normalizeClassName(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = await getAuthenticatedUserFromCookie(cookieStore);
    if (!user) {
      const { status, body } = unauthorized("Sign-in required to access classes.");
      return NextResponse.json(body, { status });
    }
    if (!isTeacherRole(user.role)) {
      const { status, body } = forbidden("Teacher role required to access classes.");
      return NextResponse.json(body, { status });
    }

    const classes = await prisma.classGroup.findMany({
      where: { ownerTeacherId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        joinCode: true,
        isArchived: true,
        createdAt: true,
        _count: {
          select: {
            students: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      classes: classes.map((item) => ({
        id: item.id,
        name: item.name,
        joinCode: item.joinCode,
        isArchived: item.isArchived,
        studentsCount: item._count.students,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "CLASSES_LIST_ERROR",
      defaultMessage: "Failed to load classes.",
    });
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const user = await getAuthenticatedUserFromCookie(cookieStore);
    if (!user) {
      const { status, body } = unauthorized("Sign-in required to create class.");
      return NextResponse.json(body, { status });
    }
    if (!isTeacherRole(user.role)) {
      const { status, body } = forbidden("Teacher role required to create class.");
      return NextResponse.json(body, { status });
    }

    const body = (await request.json().catch(() => ({}))) as CreateClassPayload;
    const name = normalizeClassName(body.name);
    if (name.length < 2 || name.length > 120) {
      const { status, body: err } = badRequest("Class name must be 2-120 characters.");
      return NextResponse.json(err, { status });
    }

    const joinCode = await generateUniqueJoinCode();
    const created = await prisma.classGroup.create({
      data: {
        ownerTeacherId: user.id,
        name,
        joinCode,
      },
      select: {
        id: true,
        name: true,
        joinCode: true,
        isArchived: true,
        createdAt: true,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "class.create",
      entityType: "class_group",
      entityId: created.id,
      payload: {
        name: created.name,
      },
    });

    return NextResponse.json({
      ok: true,
      class: {
        id: created.id,
        name: created.name,
        joinCode: created.joinCode,
        isArchived: created.isArchived,
        studentsCount: 0,
        createdAt: created.createdAt.toISOString(),
      },
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "CLASS_CREATE_ERROR",
      defaultMessage: "Failed to create class.",
    });
    return NextResponse.json(body, { status });
  }
}
