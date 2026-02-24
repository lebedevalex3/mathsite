import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

import { getCurrentUserWithRole, requireTeacher } from "@/src/lib/auth/requireRole";

export { getCurrentUserWithRole };

export async function requireTeacherFromCookies(cookieStore: ReadonlyRequestCookies) {
  return requireTeacher(cookieStore);
}
