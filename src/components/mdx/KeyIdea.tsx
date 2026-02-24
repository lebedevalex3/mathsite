import type { ReactNode } from "react";

type KeyIdeaProps = {
  title?: string;
  children: ReactNode;
};

export function KeyIdea({ title = "Ключевая идея", children }: KeyIdeaProps) {
  return (
    <div className="my-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">
        {title}
      </p>
      <div className="text-sm leading-6">{children}</div>
    </div>
  );
}

