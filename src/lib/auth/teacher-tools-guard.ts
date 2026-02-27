import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getTeacherToolsRedirectReason } from "@/src/lib/auth/access";
import { getAuthenticatedUserFromCookie, type AuthUser } from "@/src/lib/auth/provider";

type Locale = "ru" | "en" | "de" | string;

export function buildTeacherCabinetRedirectHref(locale: Locale, reason: "auth" | "role") {
  const query = new URLSearchParams();
  query.set("reason", reason);
  return `/${locale}/teacher/cabinet?${query.toString()}`;
}

function redirectToCabinet(locale: Locale, reason: "auth" | "role"): never {
  redirect(buildTeacherCabinetRedirectHref(locale, reason));
}

export async function requireTeacherToolsAccess(locale: Locale): Promise<AuthUser> {
  const cookieStore = await cookies();
  const user = await getAuthenticatedUserFromCookie(cookieStore);
  const reason = getTeacherToolsRedirectReason(user);
  if (reason) redirectToCabinet(locale, reason);
  if (!user) {
    throw new Error("Unreachable: user is null after redirect");
  }
  return user;
}
