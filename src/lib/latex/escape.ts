export function escapeLatexText(input: string): string {
  return input
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([{}%&#_$])/g, "\\$1")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/~/g, "\\textasciitilde{}");
}

