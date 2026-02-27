import { prisma } from "@/src/lib/db/prisma";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";

const VISITOR_COOKIE_NAME = "visitor_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

type CookieStoreLike = {
  get(name: string): { value: string } | undefined;
  set(options: {
    name: string;
    value: string;
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
    path?: string;
    maxAge?: number;
  }): void;
};

export async function getOrCreateVisitorUser(cookieStore: CookieStoreLike) {
  const authUser = await getAuthenticatedUserFromCookie(cookieStore);
  if (authUser) {
    return { userId: authUser.id, visitorId: null };
  }

  let visitorId = cookieStore.get(VISITOR_COOKIE_NAME)?.value;

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    cookieStore.set({
      name: VISITOR_COOKIE_NAME,
      value: visitorId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
    });
  }

  const user = await prisma.user.upsert({
    where: { visitorId },
    update: {},
    create: { visitorId },
  });

  return { userId: user.id, visitorId };
}
