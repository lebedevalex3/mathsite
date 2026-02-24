import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { requireTeacherFromCookies } from "@/src/lib/variants/auth";
import { getVariantDetailForOwner } from "@/src/lib/variants/repository";
import { MarkdownMath } from "@/lib/ui/MarkdownMath";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

function PrintStyles() {
  return (
    <style>{`
      @media print {
        .no-print { display: none !important; }
        .print-card { box-shadow: none !important; border-color: #d1d5db !important; }
        .print-section { break-inside: avoid; }
      }
    `}</style>
  );
}

export default async function VariantPrintPage({ params }: PageProps) {
  const { locale, id } = await params;
  const cookieStore = await cookies();

  let userId: string;
  try {
    const user = await requireTeacherFromCookies(cookieStore);
    userId = user.id;
  } catch {
    return (
      <main className="p-6">
        <p>Доступ только для учителя.</p>
        <Link href={`/${locale}/teacher/variants`}>Открыть teacher / variants</Link>
      </main>
    );
  }

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
        <Link
          href={`/${locale}/teacher/variants/${detail.id}`}
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
        >
          Назад
        </Link>
        <span className="inline-flex items-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white">
          Нажмите Ctrl/Cmd+P для печати / PDF
        </span>
      </div>

      <section className="print-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">{detail.title}</h1>
        <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <p>Ученик: ____________________________</p>
          <p>Класс: ____________________________</p>
          <p>Дата: ____________________________</p>
          <p>Тема: Пропорции</p>
        </div>
      </section>

      {[...sections.entries()].map(([sectionLabel, items]) => (
        <section
          key={sectionLabel}
          className="print-card print-section rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-950">{sectionLabel}</h2>
          <ol className="mt-4 space-y-4">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-100 bg-white p-3">
                <div className="mb-2 text-sm font-medium text-slate-700">
                  {item.orderIndex + 1}.
                </div>
                <MarkdownMath className="prose prose-slate max-w-none text-sm">
                  {item.task.statement_md}
                </MarkdownMath>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
