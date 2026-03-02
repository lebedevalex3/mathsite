import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { toApiError } from "@/src/lib/api/errors";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";
import { getOrCreateCsrfToken } from "@/src/lib/auth/csrf";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const csrfToken = getOrCreateCsrfToken(cookieStore);
    const user = await getAuthenticatedUserFromCookie(cookieStore);
    if (!user) {
      return NextResponse.json({ ok: true, authenticated: false, csrfToken });
    }
    return NextResponse.json({
      ok: true,
      csrfToken,
      authenticated: true,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        username: user.username,
        mustChangePassword: user.mustChangePassword ?? false,
      },
    });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "AUTH_SESSION_ERROR",
      defaultMessage: "Failed to load auth session.",
    });
    return NextResponse.json(body, { status });
  }
}
