export const SUPPORTED_HTML_LANGS = ["ru", "en", "de"] as const;
export type HtmlLang = (typeof SUPPORTED_HTML_LANGS)[number];

export function resolveHtmlLang(headerLocale: string | null): HtmlLang {
  if (headerLocale && SUPPORTED_HTML_LANGS.includes(headerLocale as HtmlLang)) {
    return headerLocale as HtmlLang;
  }
  return "ru";
}
