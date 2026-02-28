import path from "node:path";

import Link from "next/link";

import { parseTaxonomyMarkdownDetails } from "@/lib/tasks/taxonomy";
import { proportionSkills } from "@/src/lib/topics/proportion/module-data";
import { ProportionTrainerSkillGrid } from "@/src/components/topic/ProportionTrainerSkillGrid";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProportionTrainerEntryPage({ params }: PageProps) {
  const { locale } = await params;
  const taxonomyPath = path.join(process.cwd(), "docs", "TAXONOMY.md");
  const taxonomy = await parseTaxonomyMarkdownDetails(taxonomyPath);
  const skillMetaById = new Map(proportionSkills.map((skill) => [skill.id, skill] as const));

  const skills = taxonomy.skills
    .filter((entry) => entry.skillId.startsWith(`${taxonomy.topicId}.`))
    .map((entry) => {
      const meta = skillMetaById.get(entry.skillId);
      return {
        skillId: entry.skillId,
        title: meta?.title ?? entry.description,
        description: meta?.summary ?? entry.description,
        trainingCount: meta?.defaultTrainingCount ?? 10,
      };
    });

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
            <Link href={`/${locale}/topics/proportion`} className="hover:text-slate-950">
              Пропорции
            </Link>
          </li>
          <li>/</li>
          <li className="font-medium text-slate-950">Тренажёр</li>
        </ol>
      </nav>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
          Тренажёр • Короткая серия задач
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Выберите навык для тренировки
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Выберите навык по теме «Пропорции» и решите короткую серию задач.
          После серии вы получите краткий итог и рекомендацию, что тренировать дальше.
        </p>
      </section>

      <ProportionTrainerSkillGrid locale={locale} skills={skills} />
    </main>
  );
}
