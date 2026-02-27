import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";
import { getWorkVariantIdsForOwner } from "@/src/lib/variants/repository";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TeacherToolsWorkAnswersPrintPage({ params, searchParams }: PageProps) {
  const { locale, id } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();
  const { userId } = await getOrCreateVisitorUser(cookieStore);

  const work = await getWorkVariantIdsForOwner(id, userId);
  if (!work || work.variantIds.length === 0) notFound();

  const [firstId, ...restIds] = work.variantIds;
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") next.set(key, value);
    if (Array.isArray(value)) {
      next.delete(key);
      for (const entry of value) next.append(key, entry);
    }
  }
  next.set("fromWork", id);
  if (restIds.length > 0) {
    next.set("ids", [firstId, ...restIds].join(","));
  }

  redirect(`/${locale}/teacher-tools/variants/${firstId}/answers/print${next.toString() ? `?${next.toString()}` : ""}`);
}
