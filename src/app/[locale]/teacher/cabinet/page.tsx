import { TeacherCabinetPageClient } from "@/src/components/ui/TeacherCabinetPageClient";

type PageProps = {
  params: Promise<{ locale: "ru" | "en" | "de" }>;
  searchParams: Promise<{ reason?: string }>;
};

export default async function TeacherCabinetPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const reason =
    query.reason === "auth" || query.reason === "role"
      ? query.reason
      : null;
  return <TeacherCabinetPageClient locale={locale} initialReason={reason} />;
}
