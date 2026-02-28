import type { Metadata } from "next";
import { headers } from "next/headers";
import { resolveHtmlLang } from "@/src/lib/i18n/html-lang";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mathsite",
  description: "Math learning materials",
};

const LOCALE_HEADER = "x-mathsite-locale";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const locale = resolveHtmlLang(requestHeaders.get(LOCALE_HEADER));

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
