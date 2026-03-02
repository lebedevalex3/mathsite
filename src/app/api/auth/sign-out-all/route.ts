import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { toApiError, unauthorized } from "@/src/lib/api/errors";
import { destroyAllAuthSessions, getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";
import { writeAuditLog } from "@/src/lib/audit/log";

export const runtime = "nodejs";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const user = await getAuthenticatedUserFromCookie(cookieStore);
    if (!user) {
      const { status, body } = unauthorized("Sign-in required to sign out all sessions.");
      return NextResponse.json(body, { status });
    }

    await destroyAllAuthSessions({
      userId: user.id,
      cookieStore,
    });
    await writeAuditLog({
      actorUserId: user.id,
      action: "auth.sign_out_all",
      entityType: "user",
      entityId: user.id,
      payload: {
        role: user.role,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "AUTH_SIGN_OUT_ALL_ERROR",
      defaultMessage: "Failed to sign out all sessions.",
    });
    return NextResponse.json(body, { status });
  }
}
