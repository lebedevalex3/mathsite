import { cookies } from "next/headers";

const DEFAULT_TIMEOUT_MS = 20_000;
const PDF_DOCS_REF = "OPS_PDF.md";

type PdfUnavailableCode =
  | "PUPPETEER_NOT_INSTALLED"
  | "CHROME_NOT_FOUND"
  | "BASE_URL_INVALID"
  | "LAUNCH_FAILED"
  | "NAVIGATION_FAILED";

type PdfUnavailableContext = {
  endpoint?: string;
  hasBaseUrl: boolean;
  hasExecutablePath: boolean;
  isDev: boolean;
  targetPath?: string;
};

function isDev() {
  return process.env.NODE_ENV !== "production";
}

function buildPdfUnavailableHints() {
  return [
    "Use browser Print to PDF via /print pages.",
    "Set BASE_URL to the public URL of the app.",
    "Install Chromium and required system libraries on the server.",
    "Set PUPPETEER_EXECUTABLE_PATH if using system Chromium.",
    `See ${PDF_DOCS_REF}.`,
  ];
}

function sanitizeDetails(error: unknown) {
  if (!isDev()) return undefined;
  if (!(error instanceof Error)) return undefined;

  const message = error.message;
  const missing: string[] = [];

  if (!process.env.BASE_URL) missing.push("BASE_URL");
  if (!process.env.PUPPETEER_EXECUTABLE_PATH) missing.push("PUPPETEER_EXECUTABLE_PATH");

  return {
    reason: message.slice(0, 300),
    missing,
  };
}

function classifyPdfUnavailableError(error: unknown): PdfUnavailableCode {
  if (!(error instanceof Error)) return "LAUNCH_FAILED";
  const message = error.message;

  if (/Could not find Chrome|Browser was not found/i.test(message)) {
    return "CHROME_NOT_FOUND";
  }
  if (/Failed to launch the browser process|error while loading shared libraries/i.test(message)) {
    return "LAUNCH_FAILED";
  }
  if (/net::|Navigation timeout|Timeout .* exceeded|ERR_/i.test(message)) {
    return "NAVIGATION_FAILED";
  }
  if (/Invalid URL/i.test(message)) {
    return "BASE_URL_INVALID";
  }
  return "LAUNCH_FAILED";
}

function logPdfUnavailable(
  code: PdfUnavailableCode,
  error: unknown,
  context: PdfUnavailableContext,
) {
  const baseLog = {
    event: "pdf_unavailable",
    code,
    endpoint: context.endpoint ?? "unknown",
    targetPath: context.targetPath,
    flags: {
      hasBaseUrl: context.hasBaseUrl,
      hasExecutablePath: context.hasExecutablePath,
    },
  };

  if (context.isDev) {
    console.error(baseLog);
    if (error instanceof Error) {
      console.error(error);
    } else {
      console.error(error);
    }
    return;
  }

  console.error({
    ...baseLog,
    message: error instanceof Error ? error.message.slice(0, 200) : "PDF unavailable",
  });
}

function pdfUnavailableResponse(
  code: PdfUnavailableCode,
  error: unknown,
  context: PdfUnavailableContext,
) {
  logPdfUnavailable(code, error, context);

  const body = {
    ok: false as const,
    code: "PDF_UNAVAILABLE",
    message:
      "PDF export is not available in this environment. Use print-to-PDF via /print pages. See OPS_PDF.md.",
    hints: buildPdfUnavailableHints(),
    docs: PDF_DOCS_REF,
    ...(context.isDev ? { details: sanitizeDetails(error) } : {}),
  };

  return new Response(JSON.stringify(body), {
    status: 501,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-PDF-Engine": "chromium",
    },
  });
}

function getBaseUrlFromRequest(request: Request) {
  return process.env.BASE_URL || new URL(request.url).origin;
}

export async function renderPdfFromPrintPath(request: Request, printPath: string) {
  const context: PdfUnavailableContext = {
    endpoint: new URL(request.url).pathname,
    hasBaseUrl: Boolean(process.env.BASE_URL),
    hasExecutablePath: Boolean(process.env.PUPPETEER_EXECUTABLE_PATH),
    isDev: isDev(),
    targetPath: printPath,
  };

  let puppeteer: {
    launch: (options: Record<string, unknown>) => Promise<{
      newPage(): Promise<{
        setCookie(...args: unknown[]): Promise<unknown>;
        goto(url: string, options: Record<string, unknown>): Promise<unknown>;
        pdf(options: Record<string, unknown>): Promise<Uint8Array>;
      }>;
      close(): Promise<void>;
    }>;
  };
  try {
    const dynamicImport = Function("m", "return import(m)") as (
      moduleName: string,
    ) => Promise<unknown>;
    puppeteer = (await dynamicImport("puppeteer")) as typeof puppeteer;
  } catch (error) {
    return pdfUnavailableResponse("PUPPETEER_NOT_INSTALLED", error, context);
  }

  const cookieStore = await cookies();
  const visitorCookie = cookieStore.get("visitor_id");
  const baseUrl = getBaseUrlFromRequest(request);
  const targetUrl = new URL(printPath, `${baseUrl}/`).toString();

  if (context.isDev) {
    console.log({
      event: "pdf_render_request",
      engine: "chromium",
      endpoint: context.endpoint,
      targetPath: context.targetPath,
    });
  }

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    if (visitorCookie?.value) {
      await page.setCookie({
        name: "visitor_id",
        value: visitorCookie.value,
        url: baseUrl,
        httpOnly: true,
      });
    }

    await page.goto(targetUrl, {
      waitUntil: "networkidle0",
      timeout: DEFAULT_TIMEOUT_MS,
    });

    const pdf = await page.pdf({
      format: "A4",
      preferCSSPageSize: true,
      printBackground: true,
      margin: {
        top: "12mm",
        right: "10mm",
        bottom: "12mm",
        left: "10mm",
      },
    });

    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
        "X-PDF-Engine": "chromium",
      },
    });
  } catch (error) {
    return pdfUnavailableResponse(classifyPdfUnavailableError(error), error, context);
  } finally {
    if (browser) await browser.close();
  }
}
