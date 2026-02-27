import Link from "next/link";
import { notFound } from "next/navigation";

import { requireTeacherToolsAccess } from "@/src/lib/auth/teacher-tools-guard";
import { getVariantDetailForOwner } from "@/src/lib/variants/repository";

type PageProps = { params: Promise<{ locale: string; id: string }> };

function PrintStyles() {
  return (
    <style>{`
      @media print {
        @page { margin: 12mm; }
        .no-print { display: none !important; }
        .site-header, .site-footer { display: none !important; }
        html, body { background: #fff !important; }
      }
    `}</style>
  );
}

export default async function TeacherToolsVariantAnswersPrintPage({ params }: PageProps) {
  const { locale, id } = await params;
  const user = await requireTeacherToolsAccess(locale);
  const userId = user.id;
  const detail = await getVariantDetailForOwner(id, userId);
  if (!detail) notFound();

  const sections = new Map<string, typeof detail.tasks>();
  for (const item of detail.tasks) {
    const arr = sections.get(item.sectionLabel) ?? [];
    arr.push(item);
    sections.set(item.sectionLabel, arr);
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
      <PrintStyles />
      <div className="no-print flex flex-wrap gap-2">
        <Link href={`/${locale}/teacher-tools/variants/${detail.id}`} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900">
          Назад
        </Link>
        <span className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white">
          Ctrl/Cmd+P
        </span>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">Ответы: {detail.title}</h1>
      </section>

      {[...sections.entries()].map(([sectionLabel, items]) => (
        <section key={sectionLabel} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">{sectionLabel}</h2>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-100 bg-white p-3 text-sm">
                <span className="font-medium text-slate-900">{item.orderIndex + 1}.</span>{" "}
                <span className="text-slate-700">{item.task.answer.value}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
