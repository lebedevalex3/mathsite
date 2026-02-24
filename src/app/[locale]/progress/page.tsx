import { ProgressPageClient } from "@/src/components/ui/ProgressPageClient";

import { proporciiSkills, proporciiSubtopics } from "../5-klass/proporcii/module-data";

type PageProps = {
  params: Promise<{ locale: "ru" | "en" | "de" }>;
};

export default async function ProgressPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <ProgressPageClient
      locale={locale}
      topicId="g5.proporcii"
      subtopics={proporciiSubtopics.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
      }))}
      skills={proporciiSkills.map((item) => ({
        id: item.id,
        title: item.title,
        subtopicId: item.subtopicId,
        skillSlug: item.skillSlug,
      }))}
    />
  );
}
