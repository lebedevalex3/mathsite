import { prisma } from "@/src/lib/db/prisma";
import { TEACHER_MAX_STUDENTS } from "@/src/lib/auth/policy";

export class TeacherStudentLimitError extends Error {
  code = "STUDENT_LIMIT_REACHED";
  status = 409;
  constructor(public readonly limit: number, public readonly current: number) {
    super(`Teacher student limit reached (${current}/${limit})`);
  }
}

export async function ensureTeacherHasStudentCapacity(teacherId: string, needed = 1) {
  const result = await prisma.classStudent.count({
    where: {
      isActive: true,
      class: {
        ownerTeacherId: teacherId,
        isArchived: false,
      },
    },
  });

  if (result + needed > TEACHER_MAX_STUDENTS) {
    throw new TeacherStudentLimitError(TEACHER_MAX_STUDENTS, result);
  }
}
