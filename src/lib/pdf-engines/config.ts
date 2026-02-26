export function isLatexPdfEnabled() {
  return process.env.LATEX_PDF_ENABLED === "1";
}

export function isChromiumPdfDisabledInDev() {
  return process.env.NODE_ENV !== "production" && process.env.DISABLE_CHROMIUM_PDF === "1";
}

export function shouldPreferLatexForTwoUp() {
  return process.env.PDF_PREFER_LATEX_FOR_TWO_UP !== "0";
}

export function getDefaultPdfEngineEnv() {
  const value = process.env.PDF_ENGINE_DEFAULT;
  return value === "chromium" || value === "latex" ? value : null;
}

