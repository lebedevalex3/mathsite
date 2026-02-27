import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { toApiError } from "@/src/lib/api/errors";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = await getAuthenticatedUserFromCookie(cookieStore);
    if (!user) {
      return NextResponse.json({ ok: true, authenticated: false });
    }
    return NextResponse.json({
      ok: true,
      authenticated: true,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
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
