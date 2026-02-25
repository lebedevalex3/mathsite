import { SurfaceCard } from "@/src/components/ui/SurfaceCard";
import type { TopicMapData } from "@/src/lib/topicMaps";

import { SkillMap } from "./SkillMap";

type TopicMapCardProps = {
  title?: string;
  map: TopicMapData;
};

export function TopicMapCard({
  title = "Карта темы",
  map,
}: TopicMapCardProps) {
  return (
    <SurfaceCard className="p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Суть</h3>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
              {map.essence.map((line) => (
                <li key={line} className="rounded-xl border border-white bg-white px-3 py-2">
                  {line}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Мини-алгоритм
            </h3>
            <ol className="mt-3 space-y-2">
              {map.algorithm.map((step, index) => (
                <li key={step} className="flex items-start gap-3 rounded-xl border border-white bg-white px-3 py-2">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-sm leading-6 text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
              Типичная ошибка
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-900">
              {map.pitfalls.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Схема навыков
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Ветвления показывают порядок освоения и зависимость навыков.
          </p>
          <div className="mt-3">
            <SkillMap nodes={map.skills.nodes} edges={map.skills.edges} />
          </div>
        </section>
      </div>
    </SurfaceCard>
  );
}

