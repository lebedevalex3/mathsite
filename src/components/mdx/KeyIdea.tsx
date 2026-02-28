import type { ReactNode } from "react";

type KeyIdeaProps = {
  title?: string;
  children: ReactNode;
};

export function KeyIdea({ title = "Ключевая идея", children }: KeyIdeaProps) {
  return (
    <div className="my-5 rounded-2xl border border-[var(--border)] bg-[var(--info)] p-4 text-[var(--text-strong)]">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
        {title}
      </p>
      <div className="text-sm leading-6">{children}</div>
    </div>
  );
}

