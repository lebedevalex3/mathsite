export type PdfEngineName = "chromium" | "latex";

export type PdfRenderResult = Uint8Array;

export interface WorkPdfEngine<TWorkDocument = unknown> {
  renderStudentPdf(doc: TWorkDocument): Promise<PdfRenderResult>;
  renderAnswersPdf?(doc: TWorkDocument): Promise<PdfRenderResult>;
}

