"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { TopicSubtopicIndex } from "@/src/lib/content";
import { getBackToTopicLabel, getGrade5SidebarCopy } from "@/src/lib/i18n/sidebar";
import type { Grade5Topic } from "@/src/lib/nav/grade5";

type Grade5SidebarProps = {
  locale: string;
  topics: Grade5Topic[];
  contentByTopic: Record<string, TopicSubtopicIndex>;
  desktopCollapsed: boolean;
  onDesktopToggle: () => void;
  mobileOpen: boolean;
  onMobileOpen: () => void;
  onMobileClose: () => void;
};

function isTopicActive(pathname: string, href: string | null) {
  if (!href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarMode = "catalog" | "topic";

export function Grade5Sidebar({
  locale,
  topics,
  contentByTopic,
  desktopCollapsed,
  onDesktopToggle,
  mobileOpen,
  onMobileOpen,
  onMobileClose,
}: Grade5SidebarProps) {
  const pathname = usePathname();
  const topicSidebarContext = (() => {
    for (const topic of topics) {
      if (!topic.href) continue;
      const content = contentByTopic[topic.slug];
      if (!content) continue;

      const baseHref = topic.href;
      const isTopicOverview = pathname === baseHref;
      const isUnderTopic = pathname.startsWith(`${baseHref}/`);
      if (!isTopicOverview && !isUnderTopic) continue;

      const subtopicSlug = isUnderTopic
        ? pathname.slice(`${baseHref}/`.length).split("/")[0] ?? null
        : null;
      const currentSubtopic = subtopicSlug
        ? content.subtopics.find((item) => item.slug === subtopicSlug) ?? null
        : null;

      return {
        topic,
        content,
        baseHref,
        currentSubtopic,
      };
    }

    return null;
  })();
  const sidebarMode: SidebarMode = topicSidebarContext ? "topic" : "catalog";
  const tocItems =
    topicSidebarContext?.currentSubtopic
      ? topicSidebarContext.content.tocBySlug[topicSidebarContext.currentSubtopic.slug] ?? []
      : [];
  const [activeTocId, setActiveTocId] = useState<string | null>(null);
  const labelCopy = getGrade5SidebarCopy(locale);
  const topicTitle = topicSidebarContext?.topic.title ?? labelCopy.topicFallbackTitle;
  const backToTopicLabel = getBackToTopicLabel(locale, topicTitle);

  const tocIds = tocItems.map((item) => item.id);
  const effectiveActiveTocId =
    activeTocId && tocIds.includes(activeTocId) ? activeTocId : (tocIds[0] ?? null);

  useEffect(() => {
    if (tocIds.length === 0) return;
    const win = globalThis;
    const headerOffset = 120;

    const pickCurrentHeadingId = (headingElements: HTMLElement[]) => {
      let currentId = headingElements[0]?.id ?? null;
      for (const heading of headingElements) {
        if (heading.getBoundingClientRect().top - headerOffset <= 0) {
          currentId = heading.id;
        }
      }
      return currentId;
    };

    const headings = tocIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (headings.length === 0) return;

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        () => {
          const currentId = pickCurrentHeadingId(headings);
          if (currentId) setActiveTocId(currentId);
        },
        {
          root: null,
          threshold: [0, 1],
          rootMargin: "-120px 0px -55% 0px",
        },
      );

      headings.forEach((heading) => observer.observe(heading));
      return () => observer.disconnect();
    }

    const onScroll = () => {
      const currentId = pickCurrentHeadingId(headings);
      if (currentId) setActiveTocId(currentId);
    };

    onScroll();
    win.addEventListener("scroll", onScroll, { passive: true });
    return () => win.removeEventListener("scroll", onScroll);
  }, [pathname, tocIds]);

  const catalogNavList = (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-950">{labelCopy.topics}</p>
          <Link
            href={`/${locale}/5-klass`}
            className="text-xs font-medium text-blue-700 hover:text-blue-900"
            onClick={onMobileClose}
          >
            {labelCopy.allTopics}
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
                    onClick={onMobileClose}
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

  const topicNavList = (
    <div className="space-y-3">
      <div className="px-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-950">{labelCopy.subtopics}</p>
          <Link
            href={topicSidebarContext?.baseHref ?? `/${locale}/5-klass`}
            className="text-xs font-medium text-blue-700 hover:text-blue-900"
            onClick={onMobileClose}
          >
            {backToTopicLabel}
          </Link>
        </div>
      </div>

      <nav
        aria-label={labelCopy.subtopics}
        className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
      >
        <ul className="space-y-1">
          {(topicSidebarContext?.content.subtopics ?? []).map((item) => {
            const href = `${topicSidebarContext?.baseHref}/${item.slug}`;
            const active = item.slug === topicSidebarContext?.currentSubtopic?.slug;
            return (
              <li key={item.slug}>
                <Link
                  href={href}
                  onClick={onMobileClose}
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
                      {item.title}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {tocItems.length > 0 ? (
        <nav
          aria-label={labelCopy.contents}
          className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
        >
          <div className="px-2 py-1">
            <p className="text-sm font-semibold text-slate-950">{labelCopy.contents}</p>
          </div>
          <ul className="space-y-1">
            {tocItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => {
                    setActiveTocId(item.id);
                    onMobileClose();
                  }}
                  className={[
                    "block rounded-xl px-3 py-2 text-sm transition-colors",
                    effectiveActiveTocId === item.id
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
                  ].join(" ")}
                  aria-current={effectiveActiveTocId === item.id ? "location" : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );

  return (
    <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
      <div className="lg:hidden">
        <button
          type="button"
          onClick={onMobileOpen}
          className="mb-3 inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          aria-expanded={mobileOpen}
          aria-controls="grade5-topics-panel"
        >
          ☰ Темы
        </button>
        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Закрыть меню тем"
              className="absolute inset-0 bg-slate-950/40"
              onClick={onMobileClose}
            />
            <div
              id="grade5-topics-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Темы 5 класса"
              className="absolute inset-y-0 left-0 w-[min(92vw,340px)] overflow-y-auto border-r border-slate-200 bg-slate-50 p-4 shadow-xl"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{labelCopy.topicsNavDialog}</p>
                <button
                  type="button"
                  onClick={onMobileClose}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  aria-label="Закрыть меню тем"
                >
                  ✕
                </button>
              </div>
              {sidebarMode === "topic" ? topicNavList : catalogNavList}
            </div>
          </div>
        ) : null}
      </div>

      <div className="hidden lg:block">
        {desktopCollapsed ? (
          <div className="flex w-12 flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={onDesktopToggle}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              aria-label="Развернуть боковую панель"
              aria-expanded={!desktopCollapsed}
            >
              »
            </button>
          </div>
        ) : (
          <div className="relative max-h-[calc(100vh-6rem)]">
            <button
              type="button"
              onClick={onDesktopToggle}
              className="absolute -right-3 top-6 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
              aria-label="Свернуть боковую панель"
              aria-expanded={!desktopCollapsed}
            >
              «
            </button>
            <div className="h-full overflow-y-auto overscroll-contain pr-1">
              {sidebarMode === "topic" ? topicNavList : catalogNavList}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
