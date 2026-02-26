import type { WorkPdfEngine } from "@/src/lib/pdf-engines/types";
import { compileLatexToPdf } from "@/src/lib/latex/compile";
import { measureWorkTaskHeightsPt } from "@/src/lib/latex/measure-task-heights";
import { renderWorkAnswersLatex } from "@/src/lib/latex/templates/work-answers";
import { renderWorkTwoCutLandscapeLatex } from "@/src/lib/latex/templates/work-two-cut-landscape";
import {
  renderWorkTwoDuplicateLandscapeLatex,
  renderWorkTwoDuplicateLandscapeLatexWithMeasurements,
} from "@/src/lib/latex/templates/work-two-duplicate-landscape";
import { renderWorkSingleLatex } from "@/src/lib/latex/templates/work-single";
import { renderWorkTwoLandscapeLatex } from "@/src/lib/latex/templates/work-two-landscape";
import type { PrintableWorkDocument } from "@/src/lib/variants/printable-work";

export const latexWorkPdfEngine: WorkPdfEngine<PrintableWorkDocument> = {
  async renderStudentPdf(doc) {
    let tex: string;
    if (doc.profile.layout === "single") {
      tex = renderWorkSingleLatex(doc);
    } else if (doc.profile.layout === "two") {
      const measuredHeightsPt = await measureWorkTaskHeightsPt(doc);
      tex = renderWorkTwoLandscapeLatex(doc, measuredHeightsPt ?? undefined);
    } else if (doc.profile.layout === "two_dup") {
      const measuredHeightsPt = await measureWorkTaskHeightsPt(doc);
      tex = measuredHeightsPt
        ? renderWorkTwoDuplicateLandscapeLatexWithMeasurements(doc, measuredHeightsPt)
        : renderWorkTwoDuplicateLandscapeLatex(doc);
    } else if (doc.profile.layout === "two_cut") {
      const measuredHeightsPt = await measureWorkTaskHeightsPt(doc);
      tex = renderWorkTwoCutLandscapeLatex(doc, measuredHeightsPt ?? undefined);
    } else {
      throw new Error("LATEX_UNSUPPORTED_PROFILE: PoC supports only single, two, two_dup and two_cut layouts.");
    }
    return compileLatexToPdf(tex);
  },
  async renderAnswersPdf(doc) {
    const tex = renderWorkAnswersLatex(doc);
    return compileLatexToPdf(tex);
  },
};
