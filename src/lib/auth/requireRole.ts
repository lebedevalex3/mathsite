import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

import { prisma } from "@/src/lib/db/prisma";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";

export type AppUserRole = "student" | "teacher" | "admin";

type CurrentUser = {
  id: string;
  role: AppUserRole;
  visitorId: string | null;
};

function createForbiddenError(message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = 403;
  return error;
}

function roleSatisfies(userRole: AppUserRole, requiredRole: AppUserRole) {
  if (requiredRole === "student") return true;
  if (requiredRole === "teacher") {
    return userRole === "teacher" || userRole === "admin";
  }
  return userRole === "admin";
}

export async function getCurrentUserWithRole(cookieStore: ReadonlyRequestCookies): Promise<CurrentUser> {
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

export async function requireRole(
  cookieStore: ReadonlyRequestCookies,
  requiredRole: AppUserRole,
): Promise<CurrentUser> {
  const user = await getCurrentUserWithRole(cookieStore);

  if (!roleSatisfies(user.role, requiredRole)) {
    throw createForbiddenError(`${requiredRole} role required`);
  }

  return user;
}

export async function requireTeacher(cookieStore: ReadonlyRequestCookies) {
  return requireRole(cookieStore, "teacher");
}
