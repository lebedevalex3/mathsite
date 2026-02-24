import { SubtopicPageTemplate } from "../subtopic-page-template";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DirectSubtopicPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <SubtopicPageTemplate
      locale={locale}
      slug="direct"
      intro="Подтема про прямую пропорциональность: как величины меняются вместе и как это использовать в записях отношений."
    />
  );
}

