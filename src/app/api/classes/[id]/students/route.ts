import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, conflict, forbidden, notFound, toApiError, unauthorized } from "@/src/lib/api/errors";
import { isTeacherRole } from "@/src/lib/auth/access";
import { getAuthenticatedUserFromCookie, hashPassword } from "@/src/lib/auth/provider";
import { prisma } from "@/src/lib/db/prisma";
import { writeAuditLog } from "@/src/lib/audit/log";
import {
  generateTemporaryPassword,
  generateUniqueStudentUsername,
  isValidStudentUsername,
  normalizeStudentUsername,
} from "@/src/lib/classrooms/credentials";
import { TeacherStudentLimitError, ensureTeacherHasStudentCapacity } from "@/src/lib/classrooms/limits";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ id: string }>;
};

type CreateStudentPayload = {
  username?: unknown;
};

async function requireTeacherForClass(classId: string) {
  const cookieStore = await cookies();
  const user = await getAuthenticatedUserFromCookie(cookieStore);
  if (!user) {
    const { status, body } = unauthorized("Sign-in required to access class students.");
    return { ok: false as const, response: NextResponse.json(body, { status }) };
  }
  if (!isTeacherRole(user.role)) {
    const { status, body } = forbidden("Teacher role required to access class students.");
    return { ok: false as const, response: NextResponse.json(body, { status }) };
  }

  const classGroup = await prisma.classGroup.findFirst({
    where: {
      id: classId,
      ownerTeacherId: user.id,
    },
    select: {
      id: true,
      ownerTeacherId: true,
      isArchived: true,
    },
  });
  if (!classGroup) {
    const { status, body } = notFound("Class not found.");
    return { ok: false as const, response: NextResponse.json(body, { status }) };
  }

  return { ok: true as const, user, classGroup };
}

export async function GET(_: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const guard = await requireTeacherForClass(id);
    if (!guard.ok) return guard.response;

    const students = await prisma.classStudent.findMany({
      where: {
        classId: id,
        isActive: true,
      },
      orderBy: { joinedAt: "asc" },
      select: {
        student: {
          select: {
            id: true,
            username: true,
            mustChangePassword: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      students: students.map((item) => ({
        id: item.student.id,
        username: item.student.username,
        mustChangePassword: item.student.mustChangePassword,
        createdAt: item.student.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "CLASS_STUDENTS_LIST_ERROR",
      defaultMessage: "Failed to load class students.",
    });
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const guard = await requireTeacherForClass(id);
    if (!guard.ok) return guard.response;

    if (guard.classGroup.isArchived) {
      const { status, body } = conflict("Archived class cannot accept new students.", "CLASS_ARCHIVED");
      return NextResponse.json(body, { status });
    }

    await ensureTeacherHasStudentCapacity(guard.classGroup.ownerTeacherId, 1);

    const body = (await request.json().catch(() => ({}))) as CreateStudentPayload;
    const requestedUsername =
      typeof body.username === "string" && body.username.trim().length > 0
        ? normalizeStudentUsername(body.username)
        : null;

    if (requestedUsername && !isValidStudentUsername(requestedUsername)) {
      const { status, body: err } = badRequest(
        "username must be 5-32 chars and contain only latin letters or digits.",
      );
      return NextResponse.json(err, { status });
    }

    const username = requestedUsername ?? (await generateUniqueStudentUsername());
    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);

    const result = await prisma.$transaction(async (tx) => {
      if (requestedUsername) {
        const existing = await tx.user.findUnique({
          where: { username },
          select: { id: true },
        });
        if (existing) {
          throw conflict("Username already exists.", "USERNAME_EXISTS");
        }
      }

      const student = await tx.user.create({
        data: {
          username,
          passwordHash,
          authType: "username_password",
          mustChangePassword: true,
          role: "student",
        },
        select: {
          id: true,
          username: true,
          mustChangePassword: true,
          createdAt: true,
        },
      });

      await tx.classStudent.create({
        data: {
          classId: id,
          studentId: student.id,
          isActive: true,
        },
      });

      return student;
    });

    await writeAuditLog({
      actorUserId: guard.user.id,
      action: "class.student.create",
      entityType: "user",
      entityId: result.id,
      payload: {
        classId: id,
        username: result.username,
      },
    });

    return NextResponse.json({
      ok: true,
      student: {
        id: result.id,
        username: result.username,
        mustChangePassword: result.mustChangePassword,
        createdAt: result.createdAt.toISOString(),
        temporaryPassword: tempPassword,
      },
    });
  } catch (error) {
    if (error instanceof TeacherStudentLimitError) {
      const { status, body } = conflict(
        `Teacher student limit reached (${error.current}/${error.limit}).`,
        error.code,
      );
      return NextResponse.json(body, { status });
    }
    if (error && typeof error === "object" && "status" in error && "body" in error) {
      const typed = error as { status: number; body: unknown };
      return NextResponse.json(typed.body, { status: typed.status });
    }
    const { status, body } = toApiError(error, {
      defaultCode: "CLASS_STUDENT_CREATE_ERROR",
      defaultMessage: "Failed to create student account.",
    });
    return NextResponse.json(body, { status });
  }
}
