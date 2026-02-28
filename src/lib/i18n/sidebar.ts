import { normalizeLocale } from "./format";

export type Grade5SidebarCopy = {
  subtopics: string;
  contents: string;
  topics: string;
  allTopics: string;
  topicsNavDialog: string;
  topicFallbackTitle: string;
  catalogHint: string;
  topicsAriaLabel: string;
  ready: string;
  soon: string;
  mobileOpenTopics: string;
  closeTopicsMenu: string;
  expandSidebar: string;
  collapseSidebar: string;
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
      catalogHint: "Оглавление раздела и быстрый переход к доступным темам.",
      topicsAriaLabel: "Темы 5 класса",
      ready: "Готово",
      soon: "Скоро",
      mobileOpenTopics: "☰ Темы",
      closeTopicsMenu: "Закрыть меню тем",
      expandSidebar: "Развернуть боковую панель",
      collapseSidebar: "Свернуть боковую панель",
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
      catalogHint: "Inhaltsübersicht des Bereichs und schneller Zugriff auf verfügbare Themen.",
      topicsAriaLabel: "Themen Klasse 5",
      ready: "Bereit",
      soon: "Bald",
      mobileOpenTopics: "☰ Themen",
      closeTopicsMenu: "Themenmenü schließen",
      expandSidebar: "Seitenleiste ausklappen",
      collapseSidebar: "Seitenleiste einklappen",
    };
  }

  return {
    subtopics: "Subtopics",
    contents: "Contents",
    topics: "Grade 5 topics",
    allTopics: "All topics",
    topicsNavDialog: "Topic navigation",
    topicFallbackTitle: "Topic",
    catalogHint: "Section outline and quick access to available topics.",
    topicsAriaLabel: "Grade 5 topics",
    ready: "Ready",
    soon: "Soon",
    mobileOpenTopics: "☰ Topics",
    closeTopicsMenu: "Close topics menu",
    expandSidebar: "Expand sidebar",
    collapseSidebar: "Collapse sidebar",
  };
}

export function getBackToTopicLabel(localeInput: string, topicTitle: string) {
  const locale = normalizeLocale(localeInput);

  if (locale === "ru") return `← К теме: ${topicTitle}`;
  if (locale === "de") return `← Zurück zum Thema: ${topicTitle}`;
  return `← Back to topic: ${topicTitle}`;
}
