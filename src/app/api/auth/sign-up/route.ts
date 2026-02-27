import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, conflict, toApiError } from "@/src/lib/api/errors";
import {
  bindCredentialsToUser,
  createAuthSession,
  findUserByEmail,
  hashPassword,
  sanitizeEmail,
} from "@/src/lib/auth/provider";
import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";

export const runtime = "nodejs";

type Payload = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Payload;
    const email = sanitizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      const { status, body } = badRequest("email and password are required");
      return NextResponse.json(body, { status });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      const { status, body } = conflict("Email already exists");
      return NextResponse.json(body, { status });
    }

    const passwordHash = await hashPassword(password);
    const cookieStore = await cookies();
    const { userId } = await getOrCreateVisitorUser(cookieStore);
    const user = await bindCredentialsToUser({
      userId,
      email,
      passwordHash,
    });

    await createAuthSession({
      userId: user.id,
      cookieStore,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    const code =
      error instanceof Error && error.message === "PASSWORD_POLICY_VIOLATION"
        ? "PASSWORD_POLICY_VIOLATION"
        : undefined;
    const message =
      code === "PASSWORD_POLICY_VIOLATION"
        ? "Password must be 8-128 characters."
        : undefined;
    const { status, body } = toApiError(error, {
      defaultCode: code ?? "AUTH_SIGN_UP_ERROR",
      defaultMessage: message ?? "Failed to sign up.",
    });
    return NextResponse.json(body, { status });
  }
}
