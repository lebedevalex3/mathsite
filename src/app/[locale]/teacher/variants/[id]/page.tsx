import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import { TeacherErrorState } from "@/src/components/ui/TeacherErrorState";
import { toApiError } from "@/src/lib/api/errors";
import { requireTeacherFromCookies } from "@/src/lib/variants/auth";
import { getVariantDetailForOwner } from "@/src/lib/variants/repository";
import { MarkdownMath } from "@/lib/ui/MarkdownMath";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function TeacherVariantDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  let userId: string;
  try {
    const cookieStore = await cookies();
    const user = await requireTeacherFromCookies(cookieStore);
    userId = user.id;
  } catch (error) {
    const { body } = toApiError(error, { defaultMessage: "Failed to load variant." });
    return (
      <main className="space-y-4">
        <TeacherErrorState error={body} locale={locale} />
      </main>
    );
  }

  let detail;
  try {
    detail = await getVariantDetailForOwner(id, userId);
  } catch (error) {
    const { body } = toApiError(error, { defaultMessage: "Failed to load variant." });
    return (
      <main className="space-y-4">
        <TeacherErrorState error={body} locale={locale} />
      </main>
    );
  }
  if (!detail) notFound();

  const sections = new Map<typeof detail.tasks[number]["sectionLabel"], typeof detail.tasks>();
  for (const item of detail.tasks) {
    const arr = sections.get(item.sectionLabel) ?? [];
    arr.push(item);
    sections.set(item.sectionLabel, arr);
  }

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Teacher Variant
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{detail.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Шаблон: <code>{detail.templateId}</code> • Seed: <code>{detail.seed}</code>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/${locale}/teacher/variants/${detail.id}/print`}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Печать
          </Link>
          <Link
            href={`/${locale}/teacher/variants/${detail.id}/answers/print`}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Печать ответов
          </Link>
          <Link
            href={`/api/teacher/variants/${detail.id}/pdf?locale=${encodeURIComponent(locale)}`}
            className="inline-flex items-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Скачать PDF
          </Link>
          <Link
            href={`/api/teacher/variants/${detail.id}/answers-pdf?locale=${encodeURIComponent(locale)}`}
            className="inline-flex items-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Скачать ответы PDF
          </Link>
        </div>
      </section>

      {[...sections.entries()].map(([sectionLabel, items]) => (
        <SurfaceCard key={sectionLabel} className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">{sectionLabel}</h2>
          <ol className="mt-4 space-y-4">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 text-xs text-slate-500">
                  #{item.orderIndex + 1} • {item.taskId}
                </div>
                <MarkdownMath className="prose prose-slate max-w-none text-sm">
                  {item.task.statement_md}
                </MarkdownMath>
              </li>
            ))}
          </ol>
        </SurfaceCard>
      ))}
    </main>
  );
}
