import { notFound } from "next/navigation";

import { AuthResetPasswordPageClient } from "@/src/components/ui/AuthResetPasswordPageClient";

type PageProps = {
  params: Promise<{ locale: "ru" | "en" | "de" }>;
  searchParams: Promise<{ token?: string }>;
};

const LOCALES = ["ru", "en", "de"] as const;

export default async function ResetPasswordPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!LOCALES.includes(locale)) notFound();
  const query = await searchParams;

  return <AuthResetPasswordPageClient locale={locale} token={query.token ?? null} />;
}
