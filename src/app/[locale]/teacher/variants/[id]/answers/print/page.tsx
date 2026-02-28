import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { formatTaskAnswer } from "@/src/lib/tasks/answers";
import { requireTeacherFromCookies } from "@/src/lib/variants/auth";
import { getVariantDetailForOwner } from "@/src/lib/variants/repository";

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
        .site-header, .site-footer { display: none !important; }
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
        .print-answer-list {
          margin-top: 0 !important;
          gap: 6px !important;
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
        }
        .print-answer-item {
          break-inside: avoid;
          page-break-inside: avoid;
          border-color: #e2e8f0 !important;
          padding: 6px 8px !important;
          font-size: 10.5pt !important;
          line-height: 1.3 !important;
        }
        .print-answer-number {
          font-weight: 700 !important;
          margin-right: 4px !important;
        }
      }
    `}</style>
  );
}

export default async function VariantAnswersPrintPage({ params }: PageProps) {
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
        <h1 className="text-xl font-semibold text-slate-950">
          Ответы: {detail.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Шаблон: <code>{detail.templateId}</code>
        </p>
      </section>

      {[...sections.entries()].map(([sectionLabel, items]) => (
        <section
          key={sectionLabel}
          className="print-card print-section rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="print-section-title text-lg font-semibold text-slate-950">{sectionLabel}</h2>
          <ol className="print-answer-list mt-4 grid gap-2 sm:grid-cols-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="print-answer-item rounded-xl border border-slate-100 bg-white p-3 text-sm"
              >
                <span className="print-answer-number font-medium text-slate-900">
                  {item.orderIndex + 1}.
                </span>{" "}
                <span className="text-slate-700">{formatTaskAnswer(item.task.answer)}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
