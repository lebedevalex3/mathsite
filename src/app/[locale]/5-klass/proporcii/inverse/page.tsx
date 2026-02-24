import { SubtopicPageTemplate } from "../subtopic-page-template";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function InverseSubtopicPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <SubtopicPageTemplate
      locale={locale}
      slug="inverse"
      intro="Подтема про обратную пропорциональность и типовые задачи, где увеличение одной величины уменьшает другую."
    />
  );
}

