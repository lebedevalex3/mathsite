import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

type PracticeItem = {
  label: string;
  readHref: string;
  trainHref: string | null;
  note?: string;
  disabledReason?: string;
};

type PracticeProps = {
  items: PracticeItem[];
  title?: string;
};

export function Practice({ items, title = "Практика" }: PracticeProps) {
  return (
    <div className="my-6 space-y-3">
      <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <SurfaceCard key={`${item.label}:${item.readHref}`} className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                {item.note ? (
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.note}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <ButtonLink href={item.readHref} variant="secondary">
                  Читать
                </ButtonLink>
                {item.trainHref && !item.disabledReason ? (
                  <ButtonLink href={item.trainHref} variant="ghost">
                    Тренировать
                  </ButtonLink>
                ) : (
                  <span className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-400">
                    {item.disabledReason ?? "Недоступно"}
                  </span>
                )}
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}

