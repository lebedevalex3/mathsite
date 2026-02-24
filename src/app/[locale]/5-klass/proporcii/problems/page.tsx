import { SubtopicPageTemplate } from "../subtopic-page-template";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProblemsSubtopicPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <SubtopicPageTemplate
      locale={locale}
      slug="problems"
      intro="Подтема с текстовыми задачами на пропорции: масштаб, цена, производительность и составление пропорций по условию."
    />
  );
}
