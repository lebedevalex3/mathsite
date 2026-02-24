import { SubtopicPageTemplate } from "../subtopic-page-template";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RuleSubtopicPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <SubtopicPageTemplate
      locale={locale}
      slug="rule"
      intro="Подтема про основное свойство пропорции, проверку пропорций и вычисление неизвестного члена."
    />
  );
}

