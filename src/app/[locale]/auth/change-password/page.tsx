import { notFound } from "next/navigation";

import { AuthChangePasswordPageClient } from "@/src/components/ui/AuthChangePasswordPageClient";

type PageProps = {
  params: Promise<{ locale: "ru" | "en" | "de" }>;
  searchParams: Promise<{ next?: string }>;
};

const LOCALES = ["ru", "en", "de"] as const;

export default async function ChangePasswordPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!LOCALES.includes(locale)) notFound();
  const query = await searchParams;

  return <AuthChangePasswordPageClient locale={locale} nextPath={query.next ?? null} />;
}
