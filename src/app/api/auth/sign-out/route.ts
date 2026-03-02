import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { toApiError } from "@/src/lib/api/errors";
import { destroyAuthSession, getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";
import { writeAuditLog } from "@/src/lib/audit/log";

export const runtime = "nodejs";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const user = await getAuthenticatedUserFromCookie(cookieStore);
    await destroyAuthSession(cookieStore);
    if (user) {
      await writeAuditLog({
        actorUserId: user.id,
        action: "auth.sign_out",
        entityType: "user",
        entityId: user.id,
        payload: {
          role: user.role,
        },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "AUTH_SIGN_OUT_ERROR",
      defaultMessage: "Failed to sign out.",
    });
    return NextResponse.json(body, { status });
  }
}
