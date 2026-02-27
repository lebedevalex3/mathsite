import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getTeacherToolsRedirectReason } from "@/src/lib/auth/access";
import { getAuthenticatedUserFromCookie, type AuthUser } from "@/src/lib/auth/provider";

type Locale = "ru" | "en" | "de" | string;

function redirectToCabinet(locale: Locale, reason: "auth" | "role"): never {
  const query = new URLSearchParams();
  query.set("reason", reason);
  redirect(`/${locale}/teacher/cabinet?${query.toString()}`);
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
