import { normalizeLocale } from "./format";

export type Grade5SidebarCopy = {
  subtopics: string;
  contents: string;
  topics: string;
  allTopics: string;
  topicsNavDialog: string;
  topicFallbackTitle: string;
};

export function getGrade5SidebarCopy(localeInput: string): Grade5SidebarCopy {
  const locale = normalizeLocale(localeInput);

  if (locale === "ru") {
    return {
      subtopics: "Подтемы",
      contents: "Содержание",
      topics: "Темы 5 класса",
      allTopics: "Все темы",
      topicsNavDialog: "Навигация по темам",
      topicFallbackTitle: "Тема",
    };
  }

  if (locale === "de") {
    return {
      subtopics: "Unterthemen",
      contents: "Inhalt",
      topics: "Themen Klasse 5",
      allTopics: "Alle Themen",
      topicsNavDialog: "Themennavigation",
      topicFallbackTitle: "Thema",
    };
  }

  return {
    subtopics: "Subtopics",
    contents: "Contents",
    topics: "Grade 5 topics",
    allTopics: "All topics",
    topicsNavDialog: "Topic navigation",
    topicFallbackTitle: "Topic",
  };
}

export function getBackToTopicLabel(localeInput: string, topicTitle: string) {
  const locale = normalizeLocale(localeInput);

  if (locale === "ru") return `← К теме: ${topicTitle}`;
  if (locale === "de") return `← Zurück zum Thema: ${topicTitle}`;
  return `← Back to topic: ${topicTitle}`;
}

