import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

import { prisma } from "@/src/lib/db/prisma";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";

type TeacherRole = "teacher" | "admin";

function isTeacherRole(role: string): role is TeacherRole {
  return role === "teacher" || role === "admin";
}

export async function getCurrentUserWithRole(cookieStore: ReadonlyRequestCookies) {
  const { userId } = await getOrCreateVisitorUser(cookieStore);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, visitorId: true },
  });

  if (!user) {
    throw new Error("User not found after visitor upsert");
  }

  return user;
}

export async function requireTeacherFromCookies(cookieStore: ReadonlyRequestCookies) {
  const user = await getCurrentUserWithRole(cookieStore);
  if (!isTeacherRole(user.role)) {
    const error = new Error("Teacher access required");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
  return user;
}
