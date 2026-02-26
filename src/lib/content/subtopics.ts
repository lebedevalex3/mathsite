// Backward-compatible facade.
// Stage 2A introduces a generic content API in src/lib/content/index.ts.
export {
  clearTopicSubtopicIndexCache,
  loadTopicSubtopicIndex,
  type SubtopicDocIndexItem,
  type SubtopicMeta,
  type TocItem,
  type TopicSubtopicIndex,
} from "./index";

export {
  extractTocFromMdx,
  parseSubtopicMetaFromMdx,
  sortSubtopicsByOrder,
} from "./source-app-routes";

