import Link from "next/link";

import { ButtonLink } from "@/src/components/ui/ButtonLink";
import { Container } from "@/src/components/ui/Container";

type SiteHeaderProps = {
  locale: "ru" | "en" | "de";
};

export function SiteHeader({ locale }: SiteHeaderProps) {
  const teacherLabel =
    locale === "ru"
      ? "Учительский кабинет (ранний доступ)"
      : locale === "de"
        ? "Lehrkräfte-Bereich (Früher Zugang)"
        : "Teacher Workspace (Early Access)";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 font-semibold tracking-tight text-slate-950"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
              M
            </span>
            <span>Mathsite</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            <Link
              href={`/${locale}/5-klass/proporcii`}
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            >
              5 класс
            </Link>
            <Link
              href={`/${locale}/5-klass/proporcii`}
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            >
              Темы
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-lg border border-slate-200 bg-slate-50 p-1 sm:flex">
            {(["ru", "en", "de"] as const).map((nextLocale) => (
              <Link
                key={nextLocale}
                href={`/${nextLocale}`}
                className={[
                  "rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide",
                  nextLocale === locale
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-950",
                ].join(" ")}
              >
                {nextLocale}
              </Link>
            ))}
          </div>
          <ButtonLink
            href={`/${locale}/5-klass/proporcii/train?skill=g5.proporcii.naiti_neizvestnyi_krainei`}
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
