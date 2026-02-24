import "katex/dist/katex.min.css";
import { notFound } from "next/navigation";

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

  return <>{children}</>;
}
