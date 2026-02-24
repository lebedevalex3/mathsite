import { cookies } from "next/headers";

const DEFAULT_TIMEOUT_MS = 20_000;

function getBaseUrlFromRequest(request: Request) {
  return process.env.BASE_URL || new URL(request.url).origin;
}

export async function renderPdfFromPrintPath(request: Request, printPath: string) {
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
  } catch {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          "PDF export unavailable: puppeteer is not installed. Use browser Print to PDF via /print pages.",
      }),
      {
        status: 501,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
  }

  const cookieStore = await cookies();
  const visitorCookie = cookieStore.get("visitor_id");
  const baseUrl = getBaseUrlFromRequest(request);
  const targetUrl = new URL(printPath, `${baseUrl}/`).toString();

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
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          error instanceof Error
            ? `PDF export unavailable: ${error.message}. Use browser Print to PDF via /print pages.`
            : "PDF export unavailable. Use browser Print to PDF via /print pages.",
      }),
      {
        status: 501,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
  } finally {
    if (browser) await browser.close();
  }
}
