import { prisma } from "@/src/lib/db/prisma";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";

export const VISITOR_COOKIE_NAME = "visitor_id";
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

export async function getExistingViewerUser(cookieStore: Pick<CookieStoreLike, "get">) {
  const authUser = await getAuthenticatedUserFromCookie(cookieStore);
  if (authUser) {
    return { userId: authUser.id, visitorId: null };
  }

  const visitorId = cookieStore.get(VISITOR_COOKIE_NAME)?.value;
  if (!visitorId) {
    return { userId: null, visitorId: null };
  }

  const user = await prisma.user.findUnique({
    where: { visitorId },
    select: { id: true },
  });

  return {
    userId: user?.id ?? null,
    visitorId,
  };
}

export async function getOrCreateVisitorUser(
  cookieStore: CookieStoreLike,
): Promise<{ userId: string; visitorId: string | null }> {
  const existing = await getExistingViewerUser(cookieStore);
  if (existing.userId) {
    return {
      userId: existing.userId,
      visitorId: existing.visitorId,
    };
  }

  let visitorId = existing.visitorId;

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
