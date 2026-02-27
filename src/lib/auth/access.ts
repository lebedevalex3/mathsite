import type { AuthUser } from "@/src/lib/auth/provider";

export function isTeacherRole(role: AuthUser["role"]) {
  return role === "teacher" || role === "admin";
}

export function getTeacherToolsRedirectReason(user: AuthUser | null): "auth" | "role" | null {
  if (!user) return "auth";
  if (!isTeacherRole(user.role)) return "role";
  return null;
}
