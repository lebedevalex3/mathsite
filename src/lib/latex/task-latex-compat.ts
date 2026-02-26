export type LatexTaskCompatibilityIssueCode =
  | "HTML_TAG"
  | "TABLE_MARKDOWN"
  | "IMAGE_MARKDOWN"
  | "LINK_MARKDOWN"
  | "INLINE_CODE"
  | "FENCED_CODE";

export type LatexTaskCompatibilityIssue = {
  code: LatexTaskCompatibilityIssueCode;
  message: string;
};

export type LatexTaskCompatibilityReport = {
  compatible: boolean;
  issues: LatexTaskCompatibilityIssue[];
};

export function analyzeLatexTaskMarkdownCompatibility(md: string): LatexTaskCompatibilityReport {
  const input = typeof md === "string" ? md : "";
  const issues: LatexTaskCompatibilityIssue[] = [];

  const push = (code: LatexTaskCompatibilityIssueCode, message: string) => {
    if (!issues.some((i) => i.code === code)) {
      issues.push({ code, message });
    }
  };

  if (/<[a-z][\s\S]*?>/i.test(input)) {
    push("HTML_TAG", "Contains raw HTML tags; LaTeX backend may not render them correctly.");
  }
  if (/^\s*\|.+\|\s*$/m.test(input) || /^\s*\|?[-: ]+\|[-|: ]+\s*$/m.test(input)) {
    push("TABLE_MARKDOWN", "Contains markdown table syntax; LaTeX backend does not support tables yet.");
  }
  if (/!\[[^\]]*]\(([^)]+)\)/.test(input)) {
    push("IMAGE_MARKDOWN", "Contains markdown image syntax; LaTeX backend does not support embedded images yet.");
  }
  if (/\[[^\]]+]\(([^)]+)\)/.test(input)) {
    push("LINK_MARKDOWN", "Contains markdown links; URL rendering is not supported yet in LaTeX backend.");
  }
  if (/`[^`\n]+`/.test(input)) {
    push("INLINE_CODE", "Contains inline code spans; LaTeX backend does not format code spans yet.");
  }
  if (/```[\s\S]*?```/.test(input)) {
    push("FENCED_CODE", "Contains fenced code blocks; LaTeX backend does not support code blocks yet.");
  }

  return {
    compatible: issues.length === 0,
    issues,
  };
}

