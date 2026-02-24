import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/db/prisma";
import { getCurrentUserWithRole } from "@/src/lib/variants/auth";

export const runtime = "nodejs";

export async function POST() {
  if (process.env.ALLOW_DEV_BECOME_TEACHER !== "1") {
    return NextResponse.json(
      { code: "DISABLED", message: "Endpoint disabled in production." },
      { status: 404 },
    );
  }

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
}
