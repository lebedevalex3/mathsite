export type ContentSubtopicMeta = {
  title: string;
  slug: string;
  order: number;
};

export type ContentTocItem = {
  id: string;
  label: string;
  depth: 2 | 3;
};

export type ContentSubtopicDoc = ContentSubtopicMeta & {
  filePath: string;
  toc: ContentTocItem[];
};

export type TopicContentIndex = {
  topicSlug: string;
  subtopics: ContentSubtopicDoc[];
  tocBySlug: Record<string, ContentTocItem[]>;
};

