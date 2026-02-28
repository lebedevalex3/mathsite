import path from "node:path";

import Link from "next/link";

import { parseTaxonomyMarkdownDetails } from "@/lib/tasks/taxonomy";
import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

type PageProps = {
  params: Promise<{ locale: string }>;
};

function humanizeSkillId(skillId: string) {
  const raw = skillId.split(".").pop() ?? skillId;
  const text = raw.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default async function ProporciiTrainerEntryPage({ params }: PageProps) {
  const { locale } = await params;
  const taxonomyPath = path.join(process.cwd(), "docs", "TAXONOMY.md");
  const taxonomy = await parseTaxonomyMarkdownDetails(taxonomyPath);

  const skills = taxonomy.skills.filter((entry) =>
    entry.skillId.startsWith(`${taxonomy.topicId}.`),
  );

  return (
    <main className="space-y-6">
      <nav aria-label="Breadcrumbs" className="text-sm text-slate-600">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={`/${locale}`} className="hover:text-slate-950">
              Главная
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/${locale}/5-klass/proporcii`} className="hover:text-slate-950">
              Пропорции
            </Link>
          </li>
          <li>/</li>
          <li className="font-medium text-slate-950">Тренажёр</li>
        </ol>
      </nav>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
          Тренажёр • 10 задач подряд
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Выберите микро-умение
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Выберите навык по теме «Пропорции», затем откроется серия из 10 задач.
          Если задач пока меньше 10, вы увидите сообщение без ошибки.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {skills.map((skill) => (
          <SurfaceCard key={skill.skillId} className="flex h-full flex-col p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {skill.skillId}
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
              {humanizeSkillId(skill.skillId)}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
              {skill.description}
            </p>
            <div className="mt-4">
              <ButtonLink
                href={`/${locale}/5-klass/proporcii/train?skill=${encodeURIComponent(skill.skillId)}`}
                variant="secondary"
              >
                10 задач
              </ButtonLink>
            </div>
          </SurfaceCard>
        ))}

        <SurfaceCard className="flex h-full flex-col border-dashed border-slate-300 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Скоро
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
            Смешанный по слабым местам
          </h2>
          <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
            Подбор задач по ошибкам и времени решения из предыдущих тренировок.
          </p>
          <div className="mt-4">
            <span className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-400">
              Скоро
            </span>
          </div>
        </SurfaceCard>
      </section>
    </main>
  );
}
