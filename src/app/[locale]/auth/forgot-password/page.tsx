import { notFound } from "next/navigation";

import { AuthForgotPasswordPageClient } from "@/src/components/ui/AuthForgotPasswordPageClient";

type PageProps = {
  params: Promise<{ locale: "ru" | "en" | "de" }>;
};

const LOCALES = ["ru", "en", "de"] as const;

export default async function ForgotPasswordPage({ params }: PageProps) {
  const { locale } = await params;
  if (!LOCALES.includes(locale)) notFound();

  return <AuthForgotPasswordPageClient locale={locale} />;
}
