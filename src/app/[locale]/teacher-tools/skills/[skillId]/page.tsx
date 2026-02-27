import Link from "next/link";

import { listTeacherToolsTopics } from "@/src/lib/teacher-tools/catalog";

type Props = {
  params: Promise<{
    locale: "ru" | "en" | "de";
    skillId: string;
  }>;
  searchParams: Promise<{
    topicId?: string;
    topics?: string;
    tasks?: string;
    variants?: string;
    workType?: string;
    shuffle?: string;
    grade?: string;
    domain?: string;
    c?: string | string[];
  }>;
};

export default async function TeacherToolsSkillCardPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const copy = {
    ru: {
      title: "Карточка навыка",
      notFound: "Навык не найден.",
      back: "Вернуться в конструктор",
      example: "Пример",
      algorithm: "Краткий алгоритм",
      trainer: "Перейти к тренажёру",
      trainerSoon: "Тренажёр скоро",
    },
    en: {
      title: "Skill card",
      notFound: "Skill not found.",
      back: "Back to builder",
      example: "Example",
      algorithm: "Short algorithm",
      trainer: "Go to trainer",
      trainerSoon: "Trainer coming soon",
    },
    de: {
      title: "Skill-Karte",
      notFound: "Fähigkeit nicht gefunden.",
      back: "Zurück zum Generator",
      example: "Beispiel",
      algorithm: "Kurzer Algorithmus",
      trainer: "Zum Trainer",
      trainerSoon: "Trainer folgt",
    },
  } as const;

  const t = copy[resolvedParams.locale];
  const skillId = decodeURIComponent(resolvedParams.skillId);
  const topics = listTeacherToolsTopics();
  const skill =
    topics.flatMap((topic) => topic.skills).find((item) => item.id === skillId) ?? null;
  const backQuery = new URLSearchParams();
  const passthroughKeys: Array<keyof typeof resolvedSearchParams> = [
    "topicId",
    "topics",
    "tasks",
    "variants",
    "workType",
    "shuffle",
    "grade",
    "domain",
  ];
  for (const key of passthroughKeys) {
    const value = resolvedSearchParams[key];
    if (typeof value === "string" && value.length > 0) {
      backQuery.set(key, value);
    }
  }
  const rawCounts = resolvedSearchParams.c;
  const counts = Array.isArray(rawCounts) ? rawCounts : rawCounts ? [rawCounts] : [];
  for (const item of counts) {
    if (typeof item === "string" && item.length > 0) {
      backQuery.append("c", item);
    }
  }
  const backHref = `/${resolvedParams.locale}/teacher-tools${backQuery.size > 0 ? `?${backQuery.toString()}` : ""}`;

  if (!skill) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-semibold text-slate-950">{t.title}</h1>
        <p className="text-sm text-slate-600">{t.notFound}</p>
        <Link
          href={backHref}
          className="text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          {t.back}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Teacher tools
        </p>
        <h1 className="text-2xl font-semibold text-slate-950">{t.title}</h1>
        <p className="text-lg font-semibold text-slate-900">{skill.title}</p>
        {skill.summary ? (
          <p className="text-sm leading-6 text-slate-700">{skill.summary}</p>
        ) : null}
        {skill.example ? (
          <p className="text-sm text-slate-700">
            <span className="font-medium text-slate-900">{t.example}:</span> {skill.example}
          </p>
        ) : null}
      </div>

      {skill.algorithm && skill.algorithm.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-base font-semibold text-slate-900">{t.algorithm}</h2>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm leading-6 text-slate-700">
            {skill.algorithm.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {skill.trainerHref ? (
          <Link
            href={`/${resolvedParams.locale}${skill.trainerHref}`}
            className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t.trainer}
          </Link>
        ) : (
          <span className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-400">
            {t.trainerSoon}
          </span>
        )}
        <Link
          href={backHref}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
        >
          {t.back}
        </Link>
      </div>
    </main>
  );
}
