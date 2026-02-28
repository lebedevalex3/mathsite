import { ProgressPageClient } from "@/src/components/ui/ProgressPageClient";
import { proportionSkills, proportionSubtopics } from "@/src/lib/topics/proportion/module-data";

type PageProps = {
  params: Promise<{ locale: "ru" | "en" | "de" }>;
};

export default async function ProgressPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <ProgressPageClient
      locale={locale}
      topicId="math.proportion"
      subtopics={proportionSubtopics.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
      }))}
      skills={proportionSkills.map((item) => ({
        id: item.id,
        title: item.title,
        subtopicId: item.subtopicId,
        skillSlug: item.skillSlug,
      }))}
    />
  );
}
