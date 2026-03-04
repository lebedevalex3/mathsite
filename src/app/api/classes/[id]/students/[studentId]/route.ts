import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { forbidden, notFound, toApiError, unauthorized } from "@/src/lib/api/errors";
import { verifyCsrfRequestIfAuthenticated } from "@/src/lib/auth/csrf";
import { isTeacherRole } from "@/src/lib/auth/access";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";
import { prisma } from "@/src/lib/db/prisma";
import { writeAuditLog } from "@/src/lib/audit/log";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ id: string; studentId: string }>;
};

export async function DELETE(request: Request, { params }: RouteProps) {
  try {
    const { id: classId, studentId } = await params;
    const cookieStore = await cookies();
    const csrfError = verifyCsrfRequestIfAuthenticated(request, cookieStore);
    if (csrfError) {
      const { status, body } = csrfError;
      return NextResponse.json(body, { status });
    }
    const user = await getAuthenticatedUserFromCookie(cookieStore);
    if (!user) {
      const { status, body } = unauthorized("Sign-in required to remove class student.");
      return NextResponse.json(body, { status });
    }
    if (!isTeacherRole(user.role)) {
      const { status, body } = forbidden("Teacher role required to remove class student.");
      return NextResponse.json(body, { status });
    }

    const classGroup = await prisma.classGroup.findFirst({
      where: {
        id: classId,
        ownerTeacherId: user.id,
      },
      select: { id: true },
    });
    if (!classGroup) {
      const { status, body } = notFound("Class not found.");
      return NextResponse.json(body, { status });
    }

    const membership = await prisma.classStudent.findFirst({
      where: {
        classId,
        studentId,
        isActive: true,
      },
      select: { id: true },
    });
    if (!membership) {
      const { status, body } = notFound("Student is not active in this class.");
      return NextResponse.json(body, { status });
    }

    await prisma.classStudent.update({
      where: { id: membership.id },
      data: { isActive: false },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "class.student.remove",
      entityType: "user",
      entityId: studentId,
      payload: { classId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "CLASS_STUDENT_REMOVE_ERROR",
      defaultMessage: "Failed to remove student from class.",
    });
    return NextResponse.json(body, { status });
  }
}
