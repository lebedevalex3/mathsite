import { TeacherToolsPageClient } from "@/src/components/ui/TeacherToolsPageClient";

type PageProps = {
  params: Promise<{ locale: "ru" | "en" | "de" }>;
};

export default async function TeacherToolsPage({ params }: PageProps) {
  const { locale } = await params;
  return <TeacherToolsPageClient locale={locale} />;
}
