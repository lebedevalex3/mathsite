"use client";

import { useEffect, useState } from "react";

import type { TopicSubtopicIndex } from "@/src/lib/content";
import type { Grade5Topic } from "@/src/lib/nav/grade5";

import { Grade5Sidebar } from "./Grade5Sidebar";

type Grade5LayoutShellProps = {
  locale: string;
  topics: Grade5Topic[];
  contentByTopic: Record<string, TopicSubtopicIndex>;
  children: React.ReactNode;
};

const SIDEBAR_COLLAPSED_KEY = "ms.sidebarCollapsed";

function readCollapsedFromStorage() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function writeCollapsedToStorage(value: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
  } catch {
    // Ignore storage errors (private mode, denied access, etc.)
  }
}

export function Grade5LayoutShell({
  locale,
  topics,
  contentByTopic,
  children,
}: Grade5LayoutShellProps) {
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return readCollapsedFromStorage();
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    writeCollapsedToStorage(desktopCollapsed);
  }, [desktopCollapsed]);

  useEffect(() => {
    if (!mobileOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <div
      className={[
        "grid gap-6 lg:items-start",
        desktopCollapsed
          ? "lg:grid-cols-[48px_minmax(0,1fr)]"
          : "lg:grid-cols-[300px_minmax(0,1fr)]",
        "lg:transition-[grid-template-columns] lg:duration-200",
      ].join(" ")}
    >
      <Grade5Sidebar
        locale={locale}
        topics={topics}
        contentByTopic={contentByTopic}
        desktopCollapsed={desktopCollapsed}
        onDesktopToggle={() => setDesktopCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onMobileOpen={() => setMobileOpen(true)}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
