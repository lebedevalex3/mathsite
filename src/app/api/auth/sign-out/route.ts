import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { toApiError } from "@/src/lib/api/errors";
import { destroyAuthSession } from "@/src/lib/auth/provider";

export const runtime = "nodejs";

export async function POST() {
  try {
    const cookieStore = await cookies();
    await destroyAuthSession(cookieStore);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultCode: "AUTH_SIGN_OUT_ERROR",
      defaultMessage: "Failed to sign out.",
    });
    return NextResponse.json(body, { status });
  }
}
