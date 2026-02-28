export type TopicDomain = "arithmetic" | "algebra" | "geometry" | "data";
export type TopicStatus = "ready" | "soon";
export type AppLocale = "ru" | "en" | "de";

export type TopicCatalogEntry = {
  id: string;
  slug: string;
  domain: TopicDomain;
  domains?: TopicDomain[];
  levels: number[];
  status: TopicStatus;
  title: Record<AppLocale, string>;
  description: Record<AppLocale, string>;
  searchTerms: Record<AppLocale, string[]>;
  canRead: boolean;
  canTrain: boolean;
};

export const topicCatalogEntries: TopicCatalogEntry[] = [
  {
    id: "g5.proporcii",
    slug: "topics/proporcii",
    domain: "arithmetic",
    levels: [5],
    status: "ready",
    title: {
      ru: "Пропорции",
      en: "Proportions",
      de: "Proportionen",
    },
    description: {
      ru: "Конспект, микро-умения и тренажёр «10 задач подряд» по ключевым операциям.",
      en: "Topic notes, micro-skills, and a 10-in-a-row trainer for key operations.",
      de: "Kurzkonzept, Mikro-Fähigkeiten und 10er-Training zu wichtigen Operationen.",
    },
    searchTerms: {
      ru: ["пропорции", "масштаб", "цена", "свойство пропорции", "микро-умения"],
      en: ["proportions", "scale", "price", "ratio property"],
      de: ["proportionen", "maßstab", "preis", "verhältnis"],
    },
    canRead: true,
    canTrain: true,
  },
  {
    id: "g5.fractions",
    slug: "5-klass/drobi",
    domain: "arithmetic",
    levels: [5],
    status: "soon",
    title: {
      ru: "Дроби",
      en: "Fractions",
      de: "Brüche",
    },
    description: {
      ru: "Сравнение, сокращение и действия с дробями.",
      en: "Comparison, simplification, and operations with fractions.",
      de: "Vergleichen, Kürzen und Rechnen mit Brüchen.",
    },
    searchTerms: {
      ru: ["дроби", "сокращение", "сравнение дробей"],
      en: ["fractions", "simplify fractions"],
      de: ["brüche", "kürzen"],
    },
    canRead: false,
    canTrain: false,
  },
  {
    id: "g5.uravneniya",
    slug: "5-klass/uravneniya",
    domain: "algebra",
    domains: ["arithmetic", "algebra"],
    levels: [5],
    status: "ready",
    title: {
      ru: "Уравнения",
      en: "Equations",
      de: "Gleichungen",
    },
    description: {
      ru: "Простейшие линейные уравнения и проверка решения.",
      en: "Basic linear equations and solution checks.",
      de: "Einfache lineare Gleichungen und Lösungsprüfung.",
    },
    searchTerms: {
      ru: ["уравнения", "линейные", "проверка решения"],
      en: ["equations", "linear equations"],
      de: ["gleichungen", "linear"],
    },
    canRead: false,
    canTrain: false,
  },
  {
    id: "g5.geometry-angles",
    slug: "5-klass/geometriya-ugly",
    domain: "geometry",
    levels: [5],
    status: "soon",
    title: {
      ru: "Углы и фигуры",
      en: "Angles and Shapes",
      de: "Winkel und Figuren",
    },
    description: {
      ru: "Базовые геометрические фигуры, углы и измерения.",
      en: "Basic geometric shapes, angles, and measurements.",
      de: "Grundlegende Figuren, Winkel und Messungen.",
    },
    searchTerms: {
      ru: ["геометрия", "углы", "фигуры"],
      en: ["geometry", "angles", "shapes"],
      de: ["geometrie", "winkel", "figuren"],
    },
    canRead: false,
    canTrain: false,
  },
  {
    id: "g6.percentages",
    slug: "6-klass/procenty",
    domain: "data",
    levels: [6],
    status: "soon",
    title: {
      ru: "Проценты и данные",
      en: "Percentages and Data",
      de: "Prozente und Daten",
    },
    description: {
      ru: "Проценты, таблицы и чтение простых данных.",
      en: "Percentages, tables, and reading simple data.",
      de: "Prozente, Tabellen und einfache Datenauswertung.",
    },
    searchTerms: {
      ru: ["проценты", "данные", "таблицы"],
      en: ["percentages", "data", "tables"],
      de: ["prozente", "daten", "tabellen"],
    },
    canRead: false,
    canTrain: false,
  },
  {
    id: "g6.otricatelnye_chisla",
    slug: "6-klass/otricatelnye-chisla",
    domain: "algebra",
    domains: ["algebra"],
    levels: [6],
    status: "ready",
    title: {
      ru: "Отрицательные числа",
      en: "Negative Numbers",
      de: "Negative Zahlen",
    },
    description: {
      ru: "Сравнение, модуль и действия с целыми числами со знаком.",
      en: "Comparison, absolute value, and signed integer operations.",
      de: "Vergleich, Betrag und Rechnen mit ganzen Zahlen mit Vorzeichen.",
    },
    searchTerms: {
      ru: ["отрицательные числа", "модуль", "целые числа", "координатная прямая"],
      en: ["negative numbers", "absolute value", "integers"],
      de: ["negative zahlen", "betrag", "ganze zahlen"],
    },
    canRead: false,
    canTrain: false,
  },
];

export function getTopicDomains(entry: TopicCatalogEntry): TopicDomain[] {
  if (entry.domains && entry.domains.length > 0) return entry.domains;
  return [entry.domain];
}
