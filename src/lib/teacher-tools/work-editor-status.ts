export type WorkEditorStatusPhase = "ready" | "dirty" | "saving" | "error";

export type WorkEditorStatusSource = "workType" | "placement";

export type WorkEditorStatusEventDetail = {
  workId: string;
  source: WorkEditorStatusSource;
  phase?: WorkEditorStatusPhase;
};

export const WORK_EDITOR_STATUS_EVENT = "mathsite:work-editor-status";

export function publishWorkEditorStatus(detail: WorkEditorStatusEventDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WORK_EDITOR_STATUS_EVENT, { detail }));
}
