import { TeacherCabinetPageClient } from "@/src/components/ui/TeacherCabinetPageClient";

type PageProps = {
  params: Promise<{ locale: "ru" | "en" | "de" }>;
};

export default async function TeacherCabinetPage({ params }: PageProps) {
  const { locale } = await params;
  return <TeacherCabinetPageClient locale={locale} />;
}
