import Link from "next/link";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

type MasterySkillItem = {
  id: string;
  title: string;
  summary?: string;
  status?: "ready" | "soon";
  href?: string;
};

type MasteryLevelItem = {
  id: string;
  title: string;
  hint?: string;
  skills: MasterySkillItem[];
};

type MasteryLevelsProps = {
  title?: string;
  subtitle?: string;
  levels: MasteryLevelItem[];
};

function getLevelAccent(levelIndex: number) {
  if (levelIndex === 0) {
    return {
      card: "border-slate-200 bg-white",
      number: "bg-[var(--primary)]",
    };
  }

  if (levelIndex === 1) {
    return {
      card: "border-slate-200 bg-white",
      number: "bg-indigo-700",
    };
  }

  return {
    card: "border-slate-200 bg-white",
    number: "bg-[var(--success)]",
  };
}

export function MasteryLevels({
  title = "Уровни освоения",
  subtitle = "Выбери уровень и начни тренировку.",
  levels,
}: MasteryLevelsProps) {
  if (!levels.length) {
    return (
      <SurfaceCard className="p-6">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">Уровни освоения скоро появятся.</p>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="p-6 sm:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {levels.map((level, levelIndex) => {
          const accent = getLevelAccent(levelIndex);
          const firstReadySkillHref = level.skills.find(
            (skill) => skill.status !== "soon" && skill.href,
          )?.href;

          return (
            <section
              key={level.id}
              className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-white ${accent.card}`}
              aria-labelledby={`mastery-level-${level.id}`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${accent.number}`}
                  >
                    {levelIndex + 1}
                  </span>
                  <div className="min-w-0">
                    <h3
                      id={`mastery-level-${level.id}`}
                      className="text-base font-semibold tracking-tight text-slate-950"
                    >
                      {level.title}
                    </h3>
                    {level.hint ? (
                      <p className="mt-1 text-xs leading-5 text-slate-600">{level.hint}</p>
                    ) : null}
                  </div>
                </div>

                <ul className="mt-4 space-y-2">
                  {level.skills.map((skill) => {
                    const isSoon = skill.status === "soon" || !skill.href;
                    const href = skill.href ?? "#";

                    return (
                      <li key={skill.id}>
                        {isSoon ? (
                          <div className="cursor-default rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left opacity-75">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-700">{skill.title}</p>
                                {skill.summary ? (
                                  <p className="mt-1 text-xs leading-5 text-slate-500">{skill.summary}</p>
                                ) : null}
                              </div>
                              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                Скоро
                              </span>
                            </div>
                          </div>
                        ) : (
                          <Link
                            href={href}
                            className="block cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition hover:bg-slate-50 hover:ring-1 hover:ring-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-900">{skill.title}</p>
                                {skill.summary ? (
                                  <p className="mt-1 text-xs leading-5 text-slate-600">{skill.summary}</p>
                                ) : null}
                              </div>
                              <span
                                aria-hidden="true"
                                className="shrink-0 pt-0.5 text-base leading-none text-slate-400"
                              >
                                →
                              </span>
                            </div>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {firstReadySkillHref ? (
                  <div className="mt-4">
                    <ButtonLink href={firstReadySkillHref} variant="secondary" className="w-full">
                      Тренировать уровень
                    </ButtonLink>
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </SurfaceCard>
  );
}
