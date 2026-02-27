import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { badRequest, toApiError, tooManyRequests, unauthorized } from "@/src/lib/api/errors";
import { consumeAuthRateLimit } from "@/src/lib/auth/rate-limit";
import {
  createAuthSession,
  findUserByEmail,
  sanitizeEmail,
  verifyPassword,
} from "@/src/lib/auth/provider";

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

    const rateLimit = consumeAuthRateLimit({
      scope: "sign-in",
      headers: request.headers,
      email,
    });
    if (rateLimit.limited) {
      const { status, body } = tooManyRequests(
        "Too many sign-in attempts. Please try again later.",
      );
      return NextResponse.json(body, {
        status,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      });
    }

    const user = await findUserByEmail(email);
    if (!user || !user.passwordHash) {
      const { status, body } = unauthorized("Invalid credentials");
      return NextResponse.json(body, { status });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const { status, body } = unauthorized("Invalid credentials");
      return NextResponse.json(body, { status });
    }

    const cookieStore = await cookies();
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
    const { status, body } = toApiError(error, {
      defaultCode: "AUTH_SIGN_IN_ERROR",
      defaultMessage: "Failed to sign in.",
    });
    return NextResponse.json(body, { status });
  }
}
