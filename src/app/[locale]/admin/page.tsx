import { notFound } from "next/navigation";

import { AdminPageClient } from "@/src/components/ui/AdminPageClient";

type PageProps = {
  params: Promise<{ locale: "ru" | "en" | "de" }>;
};

const LOCALES = ["ru", "en", "de"] as const;

export default async function AdminPage({ params }: PageProps) {
  const { locale } = await params;
  if (!LOCALES.includes(locale)) notFound();

  return <AdminPageClient locale={locale} />;
}
