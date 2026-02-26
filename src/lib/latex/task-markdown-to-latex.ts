import { escapeLatexText } from "@/src/lib/latex/escape";

const DISPLAY_MATH_RE = /\$\$([\s\S]+?)\$\$/g;
const INLINE_MATH_RE = /\$([^$\n]+)\$/g;

type Token = { key: string; value: string };

function protectMath(input: string) {
  const tokens: Token[] = [];
  let seq = 0;

  const protect = (regex: RegExp, wrap: (body: string) => string, src: string) =>
    src.replace(regex, (_, body: string) => {
      const key = `ZZMATHTOKEN${seq++}ZZ`;
      tokens.push({ key, value: wrap(body.trim()) });
      return key;
    });

  const afterDisplay = protect(DISPLAY_MATH_RE, (body) => `\\[\n${body}\n\\]`, input);
  const afterInline = protect(INLINE_MATH_RE, (body) => `$${body}$`, afterDisplay);

  return { text: afterInline, tokens };
}

function restoreMath(input: string, tokens: Token[]) {
  return tokens.reduce((acc, token) => acc.replaceAll(token.key, token.value), input);
}

function formatInlineMarkdown(text: string): string {
  // Apply lightweight markdown formatting after escaping and math-token protection.
  // Order matters: bold before italic.
  return text
    .replace(/\*\*([^*\n]+)\*\*/g, "\\\\textbf{$1}")
    .replace(/\*([^*\n]+)\*/g, "\\\\textit{$1}");
}

function convertLine(line: string): string {
  const trimmed = line.trimEnd();
  if (trimmed.length === 0) return "";
  return formatInlineMarkdown(escapeLatexText(trimmed));
}

export function markdownTaskToLatex(md: string): string {
  const raw = typeof md === "string" ? md : "";
  const { text: protectedText, tokens } = protectMath(raw);
  const lines = protectedText.split(/\r?\n/);

  const out: string[] = [];
  let inItemize = false;
  let inEnumerate = false;

  const closeLists = () => {
    if (inItemize) {
      out.push("\\end{itemize}");
      inItemize = false;
    }
    if (inEnumerate) {
      out.push("\\end{enumerate}");
      inEnumerate = false;
    }
  };

  for (const line of lines) {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);

    if (bullet) {
      if (!inItemize) {
        if (inEnumerate) {
          out.push("\\end{enumerate}");
          inEnumerate = false;
        }
        out.push("\\begin{itemize}");
        inItemize = true;
      }
      out.push(`\\item ${convertLine(bullet[1] ?? "")}`);
      continue;
    }

    if (numbered) {
      if (!inEnumerate) {
        if (inItemize) {
          out.push("\\end{itemize}");
          inItemize = false;
        }
        out.push("\\begin{enumerate}");
        inEnumerate = true;
      }
      out.push(`\\item ${convertLine(numbered[1] ?? "")}`);
      continue;
    }

    if (line.trim().length === 0) {
      closeLists();
      out.push("");
      continue;
    }

    closeLists();
    out.push(`${convertLine(line)}\\\\`);
  }

  closeLists();
  const latex = out.join("\n");
  return restoreMath(latex, tokens);
}
