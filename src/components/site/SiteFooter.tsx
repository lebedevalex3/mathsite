import Link from "next/link";

import { Container } from "@/src/components/ui/Container";

type SiteFooterProps = {
  locale: "ru" | "en" | "de";
};

export function SiteFooter({ locale }: SiteFooterProps) {
  return (
    <footer className="site-footer mt-16 border-t border-slate-200 bg-white">
      <Container className="grid gap-8 py-10 md:grid-cols-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">Mathsite</p>
          <p className="mt-2 text-sm text-slate-600">
            Электронный учебник и тренажёр по школьной математике.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">Навигация</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>
              <Link href={`/${locale}`} className="hover:text-slate-950">
                Главная
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/5-klass/proporcii`} className="hover:text-slate-950">
                Пропорции (5 класс)
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">Статус MVP</p>
          <p className="mt-2 text-sm text-slate-600">
            Контент, тренировка и локальные попытки работают без авторизации.
          </p>
        </div>
      </Container>
    </footer>
  );
}
