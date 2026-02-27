# Content Guide (MDX, Git-first)

Этот проект использует **MDX в репозитории** как источник истины для учебной теории.
Для полного процесса добавления новой темы см. `docs/TOPIC_ONBOARDING_CHECKLIST.md`.

Сейчас (Этап 2C, pilot для `Пропорций`) поддерживаются **два источника контента**:

1. `content/{locale}/{domain}/{topic}/*.mdx` (первичный источник для loader-а, если файлы есть)
2. `src/app/[locale]/.../page.mdx` (fallback, чтобы не ломать текущие роуты)

Для пилотной темы `Пропорции`:
- **канонический контент** хранится в `content/ru/arithmetic/proporcii/*.mdx`
- route-файлы в `src/app/[locale]/5-klass/proporcii/*/page.tsx` — это thin wrappers (re-export `default`)

Для других тем (пока без миграции) loader всё ещё умеет fallback в `src/app/[locale]/.../page.mdx`.

Навигация в sidebar (`Подтемы`) и TOC (`Содержание`) для этих страниц собираются автоматически из MDX через общий loader (`src/lib/content/*`).

## Quick Start: добавить новую подтему (в существующую тему)
Предпочтительный способ (Этап 1.1): использовать генератор.

1. Создай файл из шаблона:
```bash
pnpm content:new-subtopic -- --topic proporcii --slug direct-extra --title "Дополнительная подтема" --order 25
```

Опционально можно указать локаль файла контента:
```bash
pnpm content:new-subtopic -- --locale en --topic proporcii --slug direct-extra --title "Direct Proportion" --order 25
```

2. Открой созданный `content/.../*.mdx` и заполни контент.
   Генератор автоматически подставит `intro` (его можно отредактировать вручную).

3. Добавь секции статьи с явными `id` у заголовков:
```mdx
<h2 id="opredelenie">Определение</h2>
<h2 id="algoritm">Алгоритм</h2>
<h2 id="praktika">Практика</h2>
```

4. Проверь контент:
```bash
pnpm validate:content
```

5. Прогони проверки проекта:
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm dev
```

## Quick Start: создать новую тему (scaffold)
Команда создаёт тему целиком в `content/` + route wrappers + базовые записи в registry/nav/catalog/mastery.

```bash
pnpm content:new-topic -- --domain arithmetic --topic ratios --title "Отношения" --level 5 --locales ru,en,de
```

Опционально:
- `--titleEn "Ratios"`
- `--titleDe "Verhältnisse"`
- `--level 5` или `--level 6` (по умолчанию `5`)
- `--withSubtopics intro,core,practice`
- `--force` (перезапись создаваемых файлов, если уже существуют)

Что будет создано:
- `content/{locale}/{domain}/{topic}/index.mdx`
- `content/{locale}/{domain}/{topic}/01-intro.mdx`
- `content/{locale}/{domain}/{topic}/02-core.mdx`
- `content/{locale}/{domain}/{topic}/03-practice.mdx`
- route wrappers:
  - `src/app/[locale]/5-klass/{topic}/page.tsx`
  - `src/app/[locale]/5-klass/{topic}/{subtopic}/page.tsx`
- записи в:
  - `src/lib/content/topic-registry.ts`
  - `src/lib/topicMeta.ts`
  - `src/lib/nav/grade5.ts`
  - `src/lib/topicMastery.ts` (пустой skeleton)

Ручной способ (если нужно):
- шаблон: `templates/content/subtopic-page.mdx.template`
- контент: `content/ru/arithmetic/proporcii/<slug>.mdx`
- route wrapper: `src/app/[locale]/5-klass/proporcii/<slug>/page.tsx`

## Контракт metadata (обязательно)
В начале MDX-файла подтемы должен быть export:

```mdx
export const subtopicMeta = {
  title: "Название подтемы",
  slug: "slug",
  order: 10,
};
```

Почему так:
- metadata читается loader-ом без CMS
- используется для sidebar “Подтемы”
- используется для breadcrumbs / mobile selector

## Правила TOC (“Содержание”)
Sidebar TOC строится автоматически из заголовков MDX.

Рекомендуемый формат (самый надёжный):
- использовать `<h2 id="...">...</h2>` / `<h3 id="...">...</h3>`
- `id` задавать явно (стабильные якоря)

Пример:
```mdx
<h2 id="opredelenie">Определение</h2>
<h2 id="osnovnoe-svoystvo">Основное свойство</h2>
<h3 id="primer-1">Пример 1</h3>
```

Замечания:
- `id="toc"` служит для встроенного заголовка “Содержание” в статье и **не попадает** в sidebar TOC.
- На desktop TOC показывается в левом sidebar; в контенте он скрывается.
- На mobile TOC в контенте остаётся как fallback.

## Naming conventions
- `slug`: kebab-case, латиница
- `order`: шаг 10, 20, 30... (удобно вставлять между)
- Заголовки для TOC: короткие, понятные, учебниковые

## Формулы и математика
- Пиши формулы в LaTeX:
  - inline: `$a/b$`
  - block: `$$ad = bc$$`
- MDX уже настроен на `remark-math` + `rehype-katex`

## Картинки / схемы
- Храни статические файлы в `public/`
- Вставляй через `next/image` или `<img>` (если нужно быстро)

## Ограничения текущего этапа (2C pilot)
- Рендеринг из `content/` пока настроен только для пилотной темы `Пропорции`.
- Локализации `en/de` пока используют тот же route wrapper и тот же контент (`ru`) до появления переводов.
- Для остальных тем fallback в route-level MDX сохраняется.

## Масштабирование Stage 2C (следующие темы)
- Конфиг тем для content workflow хранится в `src/lib/content/topic-registry.ts`.
- Чтобы подключить следующую тему к Stage 2C:
  1. добавь тему в registry (`topicSlug`, `domain`, `routePathSegments`)
  2. перенеси/создай MDX в `content/{locale}/{domain}/{topic}/*.mdx`
  3. замени route-level `page.mdx` на thin wrappers `page.tsx` (re-export `default` из `content/...`)

Замечание по локалям:
- route wrapper общий для всех локалей и по умолчанию указывает на `defaultLocale` темы (сейчас `ru`)
- генератор при `--locale en/de` создаёт файл контента, но существующий route wrapper не перезаписывает

### Повторяемая процедура (автоматизация Stage 2C)
Есть скрипт миграции темы из route-level `page.mdx` в `content/` + route wrappers:

1. Добавь тему в `src/lib/content/topic-registry.ts`
2. Сделай dry-run:
```bash
pnpm content:migrate-topic-stage2c -- --topic <topicSlug> --locale ru --dry-run
```
3. Применить миграцию:
```bash
pnpm content:migrate-topic-stage2c -- --topic <topicSlug> --locale ru
```
4. Проверки:
```bash
pnpm validate:content
pnpm lint
pnpm typecheck
pnpm test
pnpm dev
```

Что делает скрипт:
- находит route-level `page.mdx` подтем внутри `src/app/[locale]/.../<topic>/...`
- копирует их в `content/{locale}/{domain}/{topic}/*.mdx`
- переписывает импорт `SubtopicPageTemplate` на абсолютный путь (если нужен)
- создаёт thin wrappers `page.tsx` (если их ещё нет)
- удаляет исходные `page.mdx` после успешного копирования (в write-режиме)

## DX команды (Этап 1.1)
- Создать новую тему (topic scaffold):
```bash
pnpm content:new-topic -- --domain arithmetic --topic ratios --title "Отношения" --level 5 --locales ru,en,de
```

- Создать новую подтему из шаблона:
```bash
pnpm content:new-subtopic -- --topic proporcii --slug my-subtopic --title "Моя подтема" --order 50
```

- Создать локализованный вариант контента (без перезаписи route wrapper):
```bash
pnpm content:new-subtopic -- --locale en --topic proporcii --slug my-subtopic-en --title "My Subtopic" --order 60
```

- Проверить контент (metadata/TOC/anchors):
```bash
pnpm validate:content
```

Что проверяет `validate:content` сейчас:
- наличие `subtopicMeta`
- `slug` совпадает с именем папки
- уникальность `slug`
- уникальность `order`
- наличие `<h2 id="toc">`
- отсутствие повторяющихся heading `id`
- TOC не пустой (есть ссылки в секции `toc`)
- ссылки TOC (`href="#..."`) совпадают с id заголовков
- sidebar TOC не пустой
- наличие route wrappers для content-файлов (Stage 2C темы из registry)

Строгий режим (опционально):
```bash
pnpm validate:content -- --strict-sections
```
В strict режиме дополнительно проверяются обязательные секции (idea/algorithm/mistakes/practice) по heading `id`.

Дополнительно генератор `content:new-subtopic` проверяет **до создания файла**:
- конфликт `slug`
- конфликт `order`
- создаёт route wrapper `page.tsx` для существующего URL
