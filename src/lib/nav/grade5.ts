export type Grade5TopicStatus = "ready" | "soon";

export type Grade5Topic = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: Grade5TopicStatus;
  href: string | null;
};

type Grade5TopicSeed = Omit<Grade5Topic, "href">;

const grade5TopicSeeds: Grade5TopicSeed[] = [
  {
    id: "math.proportion",
    slug: "proportion",
    title: "Пропорции",
    description: "Модуль с подтемами, микро-умениями и тренажёром по навыкам.",
    status: "ready",
  },
  {
    id: "math.fractions",
    slug: "drobi",
    title: "Дроби",
    description: "Сравнение, сокращение и базовые действия с дробями.",
    status: "soon",
  },
  {
    id: "math.percentages",
    slug: "procenty",
    title: "Проценты",
    description: "Процент от числа, число по проценту и прикладные задачи.",
    status: "soon",
  },
  {
    id: "math.equations",
    slug: "equations",
    title: "Уравнения",
    description: "Простейшие уравнения, проверка решений и типовые ошибки.",
    status: "soon",
  },
];

export function getGrade5Topics(locale: string): Grade5Topic[] {
  return grade5TopicSeeds.map((topic) => ({
    ...topic,
    href:
      topic.status === "ready"
        ? topic.id === "math.proportion"
          ? `/${locale}/topics/proportion`
          : `/${locale}/5-klass/${topic.slug}`
        : null,
  }));
}
