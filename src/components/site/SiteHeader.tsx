"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { Container } from "@/src/components/ui/Container";
import type { TopicDomain } from "@/src/lib/topicMeta";

type SiteHeaderProps = {
  locale: "ru" | "en" | "de";
};

export function SiteHeader({ locale }: SiteHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const teacherLabel =
    locale === "ru"
      ? "Учительский кабинет (ранний доступ)"
      : locale === "de"
        ? "Lehrkräfte-Bereich (Früher Zugang)"
        : "Teacher Workspace (Early Access)";

  const domainLabels: Record<TopicDomain, string> =
    locale === "ru"
      ? {
          arithmetic: "Арифметика",
          algebra: "Алгебра",
          geometry: "Геометрия",
          data: "Данные",
        }
      : locale === "de"
        ? {
            arithmetic: "Arithmetik",
            algebra: "Algebra",
            geometry: "Geometrie",
            data: "Daten",
          }
        : {
            arithmetic: "Arithmetic",
            algebra: "Algebra",
            geometry: "Geometry",
            data: "Data",
          };

  const navDomains: TopicDomain[] = ["arithmetic", "algebra", "geometry"];
  const isCatalogRoute = pathname === `/${locale}`;
  const requestedDomain = searchParams.get("domain");
  const activeCatalogDomain =
    requestedDomain === "arithmetic" ||
    requestedDomain === "algebra" ||
    requestedDomain === "geometry" ||
    requestedDomain === "data"
      ? requestedDomain
      : "arithmetic";

  return (
    <header className="site-header sticky top-0 z-30 border-b border-[var(--border)]/80 bg-[var(--surface)]/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 font-semibold tracking-tight text-[var(--text-strong)]"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-bold text-white">
              M
            </span>
            <span>Mathsite</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {navDomains.map((domain) => (
              <Link
                key={domain}
                href={`/${locale}?domain=${domain}#topics-catalog`}
                className={[
                  "rounded-md px-3 py-2 transition-colors",
                  isCatalogRoute && activeCatalogDomain === domain
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-strong)]",
                ].join(" ")}
              >
                {domainLabels[domain]}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-1 sm:flex">
            {(["ru", "en", "de"] as const).map((nextLocale) => (
              <Link
                key={nextLocale}
                href={`/${nextLocale}`}
                className={[
                  "rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide",
                  nextLocale === locale
                    ? "bg-[var(--surface)] text-[var(--text-strong)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-strong)]",
                ].join(" ")}
              >
                {nextLocale}
              </Link>
            ))}
          </div>
          <ButtonLink
            href={`/${locale}/5-klass/proporcii/trainer`}
            variant="secondary"
            className="hidden sm:inline-flex"
          >
            Тренажёр
          </ButtonLink>
          <ButtonLink href={`/${locale}/teacher`} variant="primary">
            <span className="hidden lg:inline">{teacherLabel}</span>
            <span className="lg:hidden">
              {locale === "ru" ? "Учительский кабинет" : locale === "de" ? "Lehrkräfte" : "Teacher"}
            </span>
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}
