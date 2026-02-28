import Link from "next/link";

import { Container } from "@/src/components/ui/Container";

type SiteFooterProps = {
  locale: "ru" | "en" | "de";
};

export function SiteFooter({ locale }: SiteFooterProps) {
  return (
    <footer className="site-footer mt-16 border-t border-[var(--border)] bg-[var(--surface)]">
      <Container className="grid gap-8 py-10 md:grid-cols-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-strong)]">Mathsite</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Электронный учебник и тренажёр по школьной математике.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-strong)]">Навигация</p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
            <li>
              <Link href={`/${locale}`} className="hover:text-[var(--text-strong)]">
                Главная
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/topics/proporcii`} className="hover:text-[var(--text-strong)]">
                Пропорции (5 класс)
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-strong)]">Статус MVP</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Контент, тренировка и локальные попытки работают без авторизации.
          </p>
        </div>
      </Container>
    </footer>
  );
}
