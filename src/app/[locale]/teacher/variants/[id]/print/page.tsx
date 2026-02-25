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
      .print-root {
        color: #0f172a;
      }
      @media print {
        @page { margin: 12mm; }
        html, body { background: #fff !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none !important; }
        .print-root {
          max-width: none !important;
          padding: 0 !important;
          margin: 0 !important;
          gap: 12px !important;
          font-size: 11pt;
          line-height: 1.35;
        }
        .print-card {
          box-shadow: none !important;
          border-color: #cbd5e1 !important;
          border-radius: 8px !important;
          background: #fff !important;
        }
        .print-header-card {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .print-section {
          break-inside: auto;
          page-break-inside: auto;
          margin-top: 2mm;
        }
        .print-section + .print-section {
          break-before: page;
          page-break-before: always;
        }
        .print-section-title {
          break-after: avoid;
          page-break-after: avoid;
          margin-bottom: 8px !important;
        }
        .print-task-list {
          margin-top: 0 !important;
          gap: 8px !important;
        }
        .print-task {
          break-inside: avoid;
          page-break-inside: avoid;
          border-color: #e2e8f0 !important;
          padding: 8px 10px !important;
        }
        .print-task-number {
          font-size: 10pt !important;
          font-weight: 700 !important;
          margin-bottom: 4px !important;
        }
        .print-task .prose {
          max-width: none !important;
          font-size: 10.5pt !important;
          line-height: 1.35 !important;
        }
        .print-task .prose > :first-child { margin-top: 0 !important; }
        .print-task .prose > :last-child { margin-bottom: 0 !important; }
        .print-task .prose p,
        .print-task .prose ul,
        .print-task .prose ol {
          margin-top: 0.35em !important;
          margin-bottom: 0.35em !important;
        }
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
    <main className="print-root mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
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

      <section className="print-card print-header-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
          <h2 className="print-section-title text-lg font-semibold text-slate-950">{sectionLabel}</h2>
          <ol className="print-task-list mt-4 space-y-4">
            {items.map((item) => (
              <li key={item.id} className="print-task rounded-xl border border-slate-100 bg-white p-3">
                <div className="print-task-number mb-2 text-sm font-medium text-slate-700">
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
