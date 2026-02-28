import Link from "next/link";

import { Container } from "@/src/components/ui/Container";

type SiteFooterProps = {
  locale: "ru" | "en" | "de";
};

export function SiteFooter({ locale }: SiteFooterProps) {
  const copy = {
    ru: {
      description: "Электронный учебник и тренажёр по школьной математике.",
      navigation: "Навигация",
      home: "Главная",
      topic: "Пропорции (5 класс)",
      mvpStatus: "Статус MVP",
      mvpHint: "Контент, тренировка и локальные попытки работают без авторизации.",
    },
    en: {
      description: "Digital textbook and trainer for school mathematics.",
      navigation: "Navigation",
      home: "Home",
      topic: "Proportions (Grade 5)",
      mvpStatus: "MVP Status",
      mvpHint: "Content, training, and local attempts work without sign-in.",
    },
    de: {
      description: "Digitales Lehrbuch und Trainer für Schulmathematik.",
      navigation: "Navigation",
      home: "Startseite",
      topic: "Proportionen (Klasse 5)",
      mvpStatus: "MVP-Status",
      mvpHint: "Inhalte, Training und lokale Versuche funktionieren ohne Anmeldung.",
    },
  } as const;
  const t = copy[locale];

  return (
    <footer className="site-footer mt-16 border-t border-[var(--border)] bg-[var(--surface)]">
      <Container className="grid gap-8 py-10 md:grid-cols-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-strong)]">Mathsite</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {t.description}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-strong)]">{t.navigation}</p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
            <li>
              <Link href={`/${locale}`} className="hover:text-[var(--text-strong)]">
                {t.home}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/topics/proportion`} className="hover:text-[var(--text-strong)]">
                {t.topic}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-strong)]">{t.mvpStatus}</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {t.mvpHint}
          </p>
        </div>
      </Container>
    </footer>
  );
}
