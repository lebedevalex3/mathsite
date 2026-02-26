import type { PrintableWorkDocument } from "@/src/lib/variants/printable-work";

import { escapeLatexText } from "@/src/lib/latex/escape";

function localeStrings(locale: PrintableWorkDocument["locale"]) {
  if (locale === "de") {
    return {
      title: "Loesungen",
      variant: "Variante",
    } as const;
  }
  if (locale === "en") {
    return {
      title: "Answer Key",
      variant: "Variant",
    } as const;
  }
  return {
    title: "Ответы",
    variant: "Вариант",
  } as const;
}

function normalizeAnswer(answer: unknown) {
  if (typeof answer === "string") {
    const normalized = answer.trim();
    return normalized || "—";
  }
  if (typeof answer === "number" || typeof answer === "boolean") {
    return String(answer);
  }
  return "—";
}

export function renderWorkAnswersLatex(doc: PrintableWorkDocument): string {
  const t = localeStrings(doc.locale);
  const body = doc.variants
    .map((variant) => {
      const rows = variant.tasks
        .map((task) => {
          const answer = normalizeAnswer(task.answerText);
          return `\\item ${escapeLatexText(answer)}`;
        })
        .join("\n");

      return `
\\section*{${escapeLatexText(`${t.variant} ${variant.variantNo}`)}}
\\begin{enumerate}
${rows}
\\end{enumerate}
`;
    })
    .join("\n\\newpage\n");

  return String.raw`\documentclass[12pt,a4paper]{article}
\usepackage[a4paper,margin=12mm]{geometry}
\usepackage{fontspec}
\usepackage{polyglossia}
\usepackage{enumitem}
\usepackage{amsmath,amssymb}
\setdefaultlanguage{russian}
\setmainfont{DejaVu Serif}
\setsansfont{DejaVu Sans}
\setlength{\parindent}{0pt}
\setlength{\parskip}{4pt}
\setlist[enumerate]{leftmargin=*, itemsep=2pt, topsep=4pt}
\begin{document}
{\Large \textbf{${escapeLatexText(t.title)}}}\par
\vspace{4mm}
${body}
\end{document}
`;
}
