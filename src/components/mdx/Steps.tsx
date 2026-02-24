import type { ReactNode } from "react";

type StepsProps = {
  title?: string;
  children: ReactNode;
};

export function Steps({ title = "Алгоритм", children }: StepsProps) {
  return (
    <div className="my-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
        {title}
      </p>
      <ol className="space-y-2 pl-5 text-sm leading-6 text-slate-800">{children}</ol>
    </div>
  );
}

