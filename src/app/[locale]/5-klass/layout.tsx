import { Grade5LayoutShell } from "@/src/components/site/Grade5LayoutShell";
import { loadTopicSubtopicIndex } from "@/src/lib/content";
import { getContentTopicConfig } from "@/src/lib/content/topic-registry";
import { getGrade5Topics } from "@/src/lib/nav/grade5";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function Grade5Layout({ children, params }: LayoutProps) {
  const { locale } = await params;
  const topics = getGrade5Topics(locale);
  const contentByTopicEntries = await Promise.all(
    topics
      .filter((topic) => topic.status === "ready")
      .map(async (topic) => {
        const config = getContentTopicConfig(topic.slug);
        if (!config) return null;
        const content = await loadTopicSubtopicIndex(topic.slug, {
          locale,
          domain: config.domain,
        });
        return [topic.slug, content] as const;
      }),
  );
  const contentByTopic = Object.fromEntries(
    contentByTopicEntries.filter((entry): entry is NonNullable<(typeof contentByTopicEntries)[number]> => Boolean(entry)),
  );

  return (
    <Grade5LayoutShell locale={locale} topics={topics} contentByTopic={contentByTopic}>
      {children}
    </Grade5LayoutShell>
  );
}
