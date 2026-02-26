import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { getOrCreateVisitorUser } from "@/src/lib/session/visitor";
import { getVariantDetailForOwner } from "@/src/lib/variants/repository";
import {
  chunkIntoPages,
  isTwoUpLayout,
  parsePrintLayout,
  parseVariantIdsParam,
} from "@/src/lib/variants/print-layout";
import { defaultOrientationForLayout, parsePrintOrientation } from "@/src/lib/variants/print-profile";
import { MarkdownMath } from "@/lib/ui/MarkdownMath";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ layout?: string; ids?: string; orientation?: string }>;
};

function PrintStyles({ orientation }: { orientation: "portrait" | "landscape" }) {
  const pageRule =
    orientation === "landscape"
      ? "@page { size: A4 landscape; margin: 10mm; }"
      : "@page { size: A4 portrait; margin: 12mm; }";
  return (
    <style>{`
      .print-root { color: #0f172a; }
      .print-task { break-inside: avoid; page-break-inside: avoid; }
      .print-sheet + .print-sheet { margin-top: 16px; }
      .variant-card + .variant-card { margin-top: 12px; }
      @media print {
        ${pageRule}
        .no-print { display: none !important; }
        .site-header, .site-footer { display: none !important; }
        html, body { background: #fff !important; }
        .print-root { max-width: none !important; padding: 0 !important; margin: 0 !important; }
        .print-sheet {
          break-after: page;
          page-break-after: always;
          margin: 0 !important;
          padding: 0 !important;
          display: block;
        }
        .print-sheet:last-child { break-after: auto; page-break-after: auto; }
        .print-sheet.layout-two,
        .print-sheet.layout-two-cut,
        .print-sheet.layout-two-dup {
          display: grid !important;
          grid-template-columns: 1fr 1fr;
          gap: 8mm;
          align-items: start;
        }
        .print-sheet.layout-two .variant-card,
        .print-sheet.layout-two-cut .variant-card,
        .print-sheet.layout-two-dup .variant-card {
          break-inside: avoid;
          page-break-inside: avoid;
          min-height: 0;
        }
        .print-sheet.layout-two .variant-card + .variant-card,
        .print-sheet.layout-two-cut .variant-card + .variant-card,
        .print-sheet.layout-two-dup .variant-card + .variant-card {
          margin-top: 0 !important;
        }
        .variant-card {
          box-shadow: none !important;
          border-color: #cbd5e1 !important;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .print-sheet.layout-two .variant-card,
        .print-sheet.layout-two-cut .variant-card,
        .print-sheet.layout-two-dup .variant-card {
          padding: 10px !important;
        }
        .print-sheet.layout-two .variant-card header,
        .print-sheet.layout-two-cut .variant-card header,
        .print-sheet.layout-two-dup .variant-card header {
          margin-bottom: 10px !important;
        }
        .print-sheet.layout-two .variant-card h1,
        .print-sheet.layout-two-cut .variant-card h1,
        .print-sheet.layout-two-dup .variant-card h1 {
          font-size: 14px !important;
          line-height: 1.2 !important;
        }
        .print-sheet.layout-two .variant-card header .grid,
        .print-sheet.layout-two-cut .variant-card header .grid,
        .print-sheet.layout-two-dup .variant-card header .grid {
          gap: 4px !important;
          font-size: 11px !important;
        }
        .print-sheet.layout-two ol,
        .print-sheet.layout-two-cut ol,
        .print-sheet.layout-two-dup ol {
          gap: 6px !important;
        }
        .print-sheet.layout-two .print-task,
        .print-sheet.layout-two-cut .print-task,
        .print-sheet.layout-two-dup .print-task {
          padding: 8px !important;
        }
        .print-sheet.layout-two .print-task .prose,
        .print-sheet.layout-two-cut .print-task .prose,
        .print-sheet.layout-two-dup .print-task .prose {
          font-size: 11px !important;
          line-height: 1.25 !important;
        }
      }
    `}</style>
  );
}

export default async function TeacherToolsVariantPrintPage({ params, searchParams }: PageProps) {
  const { locale, id } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();
  const { userId } = await getOrCreateVisitorUser(cookieStore);
  const layout = parsePrintLayout(query.layout);
  const orientation = parsePrintOrientation(query.orientation, defaultOrientationForLayout(layout));
  const ids = [id, ...parseVariantIdsParam(query.ids).filter((x) => x !== id)];
  const details = (
    await Promise.all(ids.map((variantId) => getVariantDetailForOwner(variantId, userId)))
  ).filter((detail): detail is NonNullable<typeof detail> => detail !== null);
  if (details.length === 0) notFound();
  const pages = chunkIntoPages(details, layout);
  const idsParam = details.map((v) => v.id).join(",");
  const basePrintPath = `/${locale}/teacher-tools/variants/${details[0].id}/print`;
  const singleHref = `${basePrintPath}?layout=single&orientation=portrait${details.length > 1 ? `&ids=${encodeURIComponent(idsParam)}` : ""}`;
  const twoHref = `${basePrintPath}?layout=two&orientation=landscape${details.length > 1 ? `&ids=${encodeURIComponent(idsParam)}` : ""}`;
  const twoDupHref = `${basePrintPath}?layout=two_dup&orientation=landscape${details.length > 1 ? `&ids=${encodeURIComponent(idsParam)}` : ""}`;
  const twoCutHref = `${basePrintPath}?layout=two_cut&orientation=landscape${details.length > 1 ? `&ids=${encodeURIComponent(idsParam)}` : ""}`;

  return (
    <main className="print-root mx-auto max-w-5xl space-y-4 p-4 sm:p-8">
      <PrintStyles orientation={orientation} />
      <div className="no-print flex flex-wrap gap-2">
        <Link href={`/${locale}/teacher-tools/variants/${details[0].id}`} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900">
          Назад
        </Link>
        <Link
          href={singleHref}
          className={[
            "rounded-lg border px-3 py-2 text-sm font-medium",
            layout === "single"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-900",
          ].join(" ")}
        >
          1 вариант/стр
        </Link>
        <Link
          href={twoHref}
          className={[
            "rounded-lg border px-3 py-2 text-sm font-medium",
              layout === "two"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-900",
          ].join(" ")}
        >
          2 варианта/стр (альбомная)
        </Link>
        <Link
          href={twoDupHref}
          className={[
            "rounded-lg border px-3 py-2 text-sm font-medium",
            layout === "two_dup"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-900",
          ].join(" ")}
        >
          Вариант 1 | Вариант 1
        </Link>
        <Link
          href={twoCutHref}
          className={[
            "rounded-lg border px-3 py-2 text-sm font-medium",
            layout === "two_cut"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-900",
          ].join(" ")}
        >
          2 варианта/стр (для разрезания)
        </Link>
        {layout === "two_cut" ? (
          <span className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
            Двусторонняя печать: переворот по короткой стороне
          </span>
        ) : null}
        <span className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white">
          Ctrl/Cmd+P
        </span>
      </div>

      {pages.map((variantsOnPage, pageIndex) => (
        <section
          key={`sheet-${pageIndex}`}
          className={`print-sheet ${
            layout === "two"
              ? "layout-two"
              : layout === "two_cut"
                ? "layout-two-cut"
                : layout === "two_dup"
                  ? "layout-two-dup"
                  : "layout-single"
          }`}
        >
          {(
            layout === "two_dup" && variantsOnPage[0]
              ? [variantsOnPage[0], variantsOnPage[0]]
              : layout === "two_cut" && pageIndex % 2 === 1
                ? [...variantsOnPage].reverse()
                : variantsOnPage
          ).map((detail, variantIndex) => (
            <article
              key={`${detail.id}-${layout === "two_dup" ? `dup-${variantIndex}` : variantIndex}`}
              className="variant-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
            >
              <header className="mb-4">
                <h1 className="text-lg font-semibold text-slate-950">
                  Вариант №{layout === "two_dup" ? pageIndex + 1 : pageIndex * (isTwoUpLayout(layout) ? 2 : 1) + variantIndex + 1}
                </h1>
                <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                  <p>Ученик: __________________</p>
                  <p>Класс: __________________</p>
                  <p>Дата: __________________</p>
                </div>
              </header>
              <ol className={isTwoUpLayout(layout) ? "space-y-2" : "space-y-3"}>
                {detail.tasks
                  .slice()
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((item) => (
                    <li key={item.id} className="print-task rounded-xl border border-slate-100 bg-white p-3">
                      <div className="mb-2 text-sm font-medium text-slate-700">{item.orderIndex + 1}.</div>
                      <MarkdownMath className="prose prose-slate max-w-none text-sm">
                        {item.task.statement_md}
                      </MarkdownMath>
                    </li>
                  ))}
              </ol>
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}
