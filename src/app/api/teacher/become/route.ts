import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/db/prisma";
import { toApiError } from "@/src/lib/api/errors";
import { getCurrentUserWithRole } from "@/src/lib/variants/auth";

export const runtime = "nodejs";

export async function POST() {
  if (process.env.ALLOW_DEV_BECOME_TEACHER !== "1") {
    return NextResponse.json(
      { ok: false, code: "DISABLED", message: "Endpoint disabled in production." },
      { status: 404 },
    );
  }

  try {
    const cookieStore = await cookies();
    const user = await getCurrentUserWithRole(cookieStore);

    if (user.role === "teacher" || user.role === "admin") {
      return NextResponse.json({ ok: true, role: user.role });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: "teacher" },
      select: { role: true },
    });

    return NextResponse.json({ ok: true, role: updated.role });
  } catch (error) {
    const { status, body } = toApiError(error, {
      defaultMessage: "Failed to update teacher role.",
    });
    return NextResponse.json(body, { status });
  }
}
