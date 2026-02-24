import type { ReactNode } from "react";

type MistakesProps = {
  title?: string;
  children: ReactNode;
};

export function Mistakes({
  title = "Типичные ошибки",
  children,
}: MistakesProps) {
  return (
    <div className="my-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-800">
        {title}
      </p>
      <ul className="space-y-2 pl-5 text-sm leading-6">{children}</ul>
    </div>
  );
}

