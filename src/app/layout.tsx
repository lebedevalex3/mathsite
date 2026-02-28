import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mathsite",
  description: "Math learning materials",
};

const LOCALES = ["ru", "en", "de"] as const;
type Locale = (typeof LOCALES)[number];
const LOCALE_HEADER = "x-mathsite-locale";

function normalizeLocale(value: string | null): Locale {
  if (value && LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return "ru";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const locale = normalizeLocale(requestHeaders.get(LOCALE_HEADER));

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
