import type { AuthUser } from "@/src/lib/auth/provider";

export function isTeacherRole(role: AuthUser["role"]) {
  return role === "teacher" || role === "admin";
}

export function isAdminRole(role: AuthUser["role"]) {
  return role === "admin";
}

export function getTeacherToolsRedirectReason(user: AuthUser | null): "auth" | "role" | null {
  if (!user) return "auth";
  if (!isTeacherRole(user.role)) return "role";
  return null;
}

export function isLocalDevRoleEscalationEnabled(
  flagValue: string | undefined,
  env: Partial<Pick<NodeJS.ProcessEnv, "NODE_ENV" | "VERCEL" | "CI">> = process.env,
) {
  if (flagValue !== "1") return false;
  if (env.NODE_ENV === "test") return true;
  if (env.NODE_ENV !== "development") return false;
  if (env.VERCEL === "1") return false;
  if (env.CI === "true") return false;
  return true;
}
