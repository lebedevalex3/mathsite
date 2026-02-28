import "katex/dist/katex.min.css";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/src/components/site/SiteFooter";
import { SiteHeader } from "@/src/components/site/SiteHeader";

const LOCALES = ["ru", "en", "de"] as const;
type Locale = (typeof LOCALES)[number];

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  if (!LOCALES.includes(typedLocale)) notFound();

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text)]">
      <SiteHeader locale={typedLocale} />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
      <SiteFooter locale={typedLocale} />
    </div>
  );
}
