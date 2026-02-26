import { markdownTaskToLatex } from "@/src/lib/latex/task-markdown-to-latex";
import type { PrintableWorkDocument } from "@/src/lib/variants/printable-work";

function languageConfig(locale: PrintableWorkDocument["locale"]) {
  if (locale === "de") {
    return {
      main: "german",
      babelDateLabel: "Datum",
      studentLabel: "Schüler",
      classLabel: "Klasse",
      variantLabel: "Variante",
    };
  }
  if (locale === "en") {
    return {
      main: "english",
      babelDateLabel: "Date",
      studentLabel: "Student",
      classLabel: "Class",
      variantLabel: "Variant",
    };
  }
  return {
    main: "russian",
    babelDateLabel: "Дата",
    studentLabel: "Ученик",
    classLabel: "Класс",
    variantLabel: "Вариант",
  };
}

export function renderWorkSingleLatex(doc: PrintableWorkDocument): string {
  const lang = languageConfig(doc.locale);

  const variantsLatex = doc.variants
    .map((variant, variantIndex) => {
      const tasks = variant.tasks
        .map(
          (task) => `
\\item
${markdownTaskToLatex(task.statementMd)}
`,
        )
        .join("\n");

      return `
\\section*{${lang.variantLabel} №${variant.variantNo}}
\\noindent ${lang.studentLabel}: \\hrulefill \\hspace{4mm} ${lang.classLabel}: \\hrulefill \\hspace{4mm} ${lang.babelDateLabel}: \\hrulefill

\\vspace{3mm}
\\begin{enumerate}
${tasks}
\\end{enumerate}
${variantIndex < doc.variants.length - 1 ? "\\newpage" : ""}
`;
    })
    .join("\n");

  return String.raw`\documentclass[12pt]{article}
\usepackage[a4paper,margin=12mm]{geometry}
\usepackage{fontspec}
\usepackage{polyglossia}
\setmainlanguage{${lang.main}}
\setmainfont{DejaVu Serif}
\usepackage{amsmath,amssymb}
\usepackage{enumitem}
\setlist[enumerate]{leftmargin=*, itemsep=4mm}
\setlist[itemize]{leftmargin=*, itemsep=2mm}
\pagestyle{empty}
\begin{document}
${variantsLatex}
\end{document}
`;
}
