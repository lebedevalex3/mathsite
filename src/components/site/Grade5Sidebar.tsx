"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { Grade5Topic } from "@/src/lib/nav/grade5";

type Grade5SidebarProps = {
  locale: string;
  topics: Grade5Topic[];
};

function isTopicActive(pathname: string, href: string | null) {
  if (!href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Grade5Sidebar({ locale, topics }: Grade5SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navList = (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-950">Темы 5 класса</p>
          <Link
            href={`/${locale}/5-klass`}
            className="text-xs font-medium text-blue-700 hover:text-blue-900"
            onClick={() => setOpen(false)}
          >
            Все темы
          </Link>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Оглавление раздела и быстрый переход к доступным темам.
        </p>
      </div>

      <nav aria-label="Темы 5 класса" className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <ul className="space-y-1">
          {topics.map((topic) => {
            const active = isTopicActive(pathname, topic.href);

            return (
              <li key={topic.id}>
                {topic.href ? (
                  <Link
                    href={topic.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "block rounded-xl border px-3 py-3 transition-colors",
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-transparent hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={[
                          "text-sm font-semibold",
                          active ? "text-white" : "text-slate-900",
                        ].join(" ")}
                      >
                        {topic.title}
                      </span>
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          active
                            ? "bg-white/15 text-white"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-700",
                        ].join(" ")}
                      >
                        Готово
                      </span>
                    </div>
                    <p
                      className={[
                        "mt-1 text-xs leading-5",
                        active ? "text-slate-200" : "text-slate-500",
                      ].join(" ")}
                    >
                      {topic.description}
                    </p>
                  </Link>
                ) : (
                  <div className="cursor-not-allowed rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-700">{topic.title}</span>
                      <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Скоро
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{topic.description}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  return (
    <aside className="min-w-0">
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="mb-3 inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          aria-expanded={open}
          aria-controls="grade5-topics-panel"
        >
          Темы
        </button>
        {open ? <div id="grade5-topics-panel">{navList}</div> : null}
      </div>

      <div className="hidden lg:block lg:sticky lg:top-20">{navList}</div>
    </aside>
  );
}

