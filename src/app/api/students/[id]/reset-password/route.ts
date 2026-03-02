import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, forbidden, notFound, toApiError, unauthorized } from "@/src/lib/api/errors";
import { getAuthenticatedUserFromCookie, hashPassword } from "@/src/lib/auth/provider";
import { validateStudentId } from "@/src/lib/auth/validation";
import { isTeacherRole } from "@/src/lib/auth/access";
import { prisma } from "@/src/lib/db/prisma";
import { generateTemporaryPassword } from "@/src/lib/classrooms/credentials";
import { writeAuditLog } from "@/src/lib/audit/log";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ id: string }>;
};

async function canResetStudentPassword(actor: { id: string; role: "student" | "teacher" | "admin" }, studentId: string) {
  if (actor.role === "admin") return true;
  if (!isTeacherRole(actor.role)) return false;

  const membership = await prisma.classStudent.findFirst({
    where: {
      studentId,
      isActive: true,
      class: {
        ownerTeacherId: actor.id,
        isArchived: false,
      },
    },
    select: { id: true },
  });
  return Boolean(membership);
}

export async function POST(_: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const studentIdInput = validateStudentId(id);
    if (!studentIdInput.ok) {
      const { status, body } = badRequest(studentIdInput.error.message, studentIdInput.error.code);
      return NextResponse.json(body, { status });
    }
    const { studentId } = studentIdInput.value;
    const cookieStore = await cookies();
    const actor = await getAuthenticatedUserFromCookie(cookieStore);
    if (!actor) {
      const { status, body } = unauthorized("Sign-in required to reset student password.");
      return NextResponse.json(body, { status });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true, username: true },
    });
    if (!student || student.role !== "student") {
      const { status, body } = notFound("Student not found.");
      return NextResponse.json(body, { status });
    }

    const allowed = await canResetStudentPassword(actor, student.id);
    if (!allowed) {
      const { status, body } = forbidden("Only admin or student's teacher can reset password.");
      return NextResponse.json(body, { status });
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    await prisma.user.update({
      where: { id: student.id },
      data: {
        passwordHash,
        authType: "username_password",
        mustChangePassword: true,
      },
    });

    await writeAuditLog({
      actorUserId: actor.id,
      action: "student.password.reset",
      entityType: "user",
      entityId: student.id,
      payload: {
        role: actor.role,
      },
    });

    return NextResponse.json({
      ok: true,
      student: {
        id: student.id,
        username: student.username,
      },
      temporaryPassword,
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "STUDENT_PASSWORD_RESET_ERROR",
      defaultMessage: "Failed to reset student password.",
    });
    return NextResponse.json(body, { status });
  }
}
