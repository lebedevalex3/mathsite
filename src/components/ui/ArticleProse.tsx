import type { ReactNode } from "react";

type ArticleProseProps = {
  children: ReactNode;
  className?: string;
};

export function ArticleProse({ children, className = "" }: ArticleProseProps) {
  return (
    <div
      className={[
        "max-w-3xl text-slate-800",
        "[&_h1]:mt-0 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-slate-950",
        "[&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-950",
        "[&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-950",
        "[&_p]:my-4 [&_p]:leading-7",
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_li]:my-1",
        "[&_a]:font-medium [&_a]:text-[var(--primary)] hover:[&_a]:text-[var(--primary-hover)]",
        "[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em]",
        "[&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre]:text-slate-100",
        "[&_hr]:my-8 [&_hr]:border-slate-200",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

