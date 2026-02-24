# Local Development (MathSite)

Единая инструкция для локального запуска MathSite (Next.js + Postgres + Prisma) и проверки MVP-флоу:
- публичный учебник/тренажёр
- attempts/progress/compare
- Teacher variants (генерация, print, PDF/fallback)

## Quick Start

```bash
# 1) Поднять Postgres
docker compose up -d

# 2) Установить зависимости
pnpm install

# 3) Prisma читает .env (не .env.local), поэтому скопируйте DATABASE_URL
cp .env.local .env

# 4) Применить миграции и сгенерировать Prisma Client
pnpm prisma migrate dev
pnpm prisma generate

# 5) Запустить dev-сервер
pnpm dev
```

Открой:
- `http://localhost:3000/ru`
- `http://localhost:3000/ru/5-klass/proporcii`
- `http://localhost:3000/ru/progress`
- `http://localhost:3000/ru/teacher/variants`

## A. Overview

Локально поднимаем:
- `web`: Next.js App Router (`pnpm dev`)
- `db`: Postgres 16 через `docker compose`
- `prisma`: миграции + Prisma Client
- `pdf` (опционально): генерация teacher PDF через `puppeteer` + Chrome/Chromium

## B. Prereqs

- Node.js: рекомендуется `20+`
- `pnpm`: проект использует **pnpm** (`pnpm-lock.yaml`)
- Docker + Docker Compose plugin (`docker compose`)
- Postgres поднимается в контейнере (локально отдельный install не нужен)
- Для PDF (опционально):
  - `puppeteer` (ставится через `pnpm install`)
  - Chrome/Chromium (или скачанный puppeteer browser)

## C. Env Files (`.env` vs `.env.local`)

Важно:
- **Next.js** читает `.env.local`
- **Prisma CLI** (`pnpm prisma ...`) обычно читает `.env`

Поэтому для локальной разработки удобно держать одинаковый `DATABASE_URL` в обоих файлах.

### Минимально нужные переменные

Обязательно:
- `DATABASE_URL` — для Prisma и API с Postgres

Опционально (PDF):
- `BASE_URL` — базовый URL для server-side открытия print pages при PDF-генерации
  - локально обычно не нужен (берётся из request origin)
- `PUPPETEER_EXECUTABLE_PATH` — путь к системному Chromium/Chrome (если используете системный браузер)

### Пример `DATABASE_URL`

Сейчас `docker-compose.yml` использует порт **5433** на хосте:

```bash
DATABASE_URL="postgresql://mathsite:mathsite@localhost:5433/mathsite?schema=public"
```

См. пример:
- `.env.example`

### Рекомендуемая настройка (локально)

```bash
cp .env.example .env.local
cp .env.local .env
```

Проверьте порт в `docker-compose.yml` и `DATABASE_URL` — они должны совпадать.

## D. First-Time Setup (пошагово)

### 1) Поднять Postgres

```bash
docker compose up -d
docker compose ps
```

Ожидаемо:
- контейнер `mathsite-postgres` в статусе `Up`
- порт `5433->5432` (если не меняли compose)

### 2) Установить зависимости

```bash
pnpm install
```

Если `pnpm` покажет предупреждение про `Ignored build scripts: puppeteer`, это не блокирует запуск сайта. Для PDF см. раздел `G. Print/PDF`.

### 3) Подготовить env-файлы

Если ещё не сделали:

```bash
cp .env.example .env.local
cp .env.local .env
```

Если у вас занят порт `5432`, оставьте `5433` (как в текущем `docker-compose.yml`) и убедитесь, что в `.env` / `.env.local` указан именно `5433`.

### 4) Prisma: миграции + client

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

Ожидаемо:
- миграции применились без `drift/diverge`
- Prisma Client сгенерирован

### 5) Запустить dev-сервер

```bash
pnpm dev
```

Открыть:
- `http://localhost:3000/ru`

### 6) Проверить attempts/progress (MVP)

1. Открой тренажёр, например:
   - `http://localhost:3000/ru/5-klass/proporcii/train?skill=g5.proporcii.naiti_neizvestnyi_krainei`
2. Реши несколько задач и нажимай `Check`
3. Открой:
   - `http://localhost:3000/ru/progress`

Ожидаемо:
- на `/progress` появляется прогресс
- если API недоступен, UI не падает (показывает пустое состояние)

### 7) Проверить Teacher variants (MVP)

1. Открой:
   - `http://localhost:3000/ru/teacher/variants`
2. Нажми `Стать учителем (dev)`
3. Выбери шаблон и нажми `Сгенерировать`
4. Открой детальную страницу варианта
5. Открой `Печать` и `Печать ответов`

## E. Prisma Migrations: drift / diverge playbook

### Типичные симптомы

- `relation "Attempt" does not exist`
- `Prisma client ... does not have property ...` (например, новых моделей)
- `Drift detected`
- `The migrations recorded in the database diverge from the local migrations directory`
- `Environment variable not found: DATABASE_URL`

### Базовая проверка подключения к БД

1. Проверь `DATABASE_URL` в `.env`:

```bash
cat .env | grep DATABASE_URL
```

2. Проверь контейнер Postgres:

```bash
docker compose ps
```

Если `localhost:5433` в `DATABASE_URL`, а в `docker-compose.yml` другой порт — исправь одно из двух.

### Когда использовать `pnpm prisma migrate dev`

Используй для обычной локальной разработки, когда:
- миграции в порядке
- база не в состоянии `drift/diverge`
- нужно применить новые миграции

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

### Когда использовать `pnpm prisma migrate reset` (только локально/dev)

Используй, если Prisma пишет `drift` / `diverge`, и это **локальная dev-база**, которую можно потерять.

```bash
pnpm prisma migrate reset --force
pnpm prisma generate
```

Важно:
- `reset` удаляет данные в локальной БД (`public` schema)
- использовать только в dev

### Когда НЕ использовать `prisma db push`

Для этого проекта **не использовать `prisma db push`** для обычного рабочего процесса, потому что:
- проект ведётся через миграции (`prisma/migrations/*`)
- `db push` может обойти историю миграций и ухудшить воспроизводимость

Нормальный путь:
- меняем schema
- создаём/применяем миграции через `prisma migrate ...`

### Если Prisma Client не соответствует схеме

Признаки:
- код использует `prisma.variant`, а рантайм/типы говорят, что такого свойства нет

Решение:

```bash
pnpm prisma generate
pnpm dev
```

## F. Teacher MVP (dev)

### Как получить роль teacher

Сначала включите dev-only endpoint в `.env.local`:

```bash
ALLOW_DEV_BECOME_TEACHER=1
```

И перезапустите `pnpm dev`.

Вариант 1 (UI, рекомендуемый):
- открыть `/{locale}/teacher/variants`
- нажать `Стать учителем (dev)`

Вариант 2 (API):

```bash
curl -X POST http://localhost:3000/api/teacher/become
```

Если флаг не включён, endpoint вернёт:

```json
{"code":"DISABLED","message":"Endpoint disabled in production."}
```

со статусом `404`.

Важно:
- роль привязана к текущему анонимному `visitor_id` cookie
- для `curl` без cookie это будет отдельный анонимный пользователь
- в production этот endpoint должен быть отключён (не включать `ALLOW_DEV_BECOME_TEACHER`)

### Где работать с вариантами

- `/{locale}/teacher/variants` — шаблоны + список сгенерированных вариантов
- `/{locale}/teacher/variants/{id}` — детали варианта

Пример:
- `http://localhost:3000/ru/teacher/variants`

### Если генератор пишет “недостаточно задач”

Это означает, что шаблон просит больше задач, чем реально доступно в банке задач по секции/навыкам/сложности.

Проверь:
- шаблоны в `templates/variants/g5/proporcii/*.json`
- `count` в секциях
- диапазон `difficulty`
- `skillIds` (должны существовать в таксономии и банке задач)

### Формат ошибок Teacher API (MVP)

Teacher API endpoints возвращают нормализованные ошибки в формате:

```json
{ "ok": false, "code": "SOME_CODE", "message": "Human-readable message" }
```

Частые коды:
- `FORBIDDEN` — нет роли teacher/admin
- `INSUFFICIENT_TASKS` — шаблон нельзя собрать из текущего банка задач
- `DB_NOT_READY` — миграции не применены / схема БД не готова
- `PRISMA_CLIENT_ERROR` — Prisma client не сгенерирован или не инициализировался

Все `/api/teacher/*` endpoints (кроме dev-only `POST /api/teacher/become`) требуют роль `teacher`/`admin` и возвращают `403` (`FORBIDDEN`) при отсутствии роли.

## G. Print / PDF

### Print pages (работают без PDF)

После генерации варианта доступны:
- `/{locale}/teacher/variants/{id}/print`
- `/{locale}/teacher/variants/{id}/answers/print`

Эти страницы:
- печатные
- рендерят LaTeX через `MarkdownMath` / KaTeX
- можно сохранить в PDF через браузер (`Ctrl/Cmd+P`)

### Как работает PDF export

Кнопки `PDF` и `Ответы PDF` вызывают API:
- `/api/teacher/variants/{id}/pdf?locale=ru`
- `/api/teacher/variants/{id}/answers-pdf?locale=ru`

API пытается:
1. открыть соответствующую `/print` страницу
2. сгенерировать PDF через `puppeteer`

Если не получается (нет puppeteer/Chrome/системных библиотек), API возвращает:
- `501`
- понятное сообщение
- рекомендацию использовать `/print` + Print-to-PDF

Это ожидаемый fallback для MVP.

Для production/staging настройки и диагностики PDF см. отдельный документ:
- `OPS_PDF.md`

### Настройка PDF (локально)

#### 1) Установить зависимости

```bash
pnpm install
```

Если `pnpm` пишет `Ignored build scripts: puppeteer`, разрешите build script:

```bash
pnpm approve-builds
```

Выберите `puppeteer`, затем:

```bash
pnpm exec puppeteer browsers install chrome
```

#### 2) (Опционально) использовать системный Chromium/Chrome

Если хотите использовать системный браузер:

```bash
which chromium-browser
# или
which chromium
# или
which google-chrome
```

Добавьте в `.env.local` (и перезапустите `pnpm dev`):

```bash
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

#### 3) Linux/WSL: системные библиотеки Chromium

Если видите ошибки вида:
- `error while loading shared libraries`
- `libasound.so.2: cannot open shared object file`

Поставьте зависимости (Ubuntu 24.04+ / t64):

```bash
sudo apt update
sudo apt install -y \
  libasound2t64 \
  libatk-bridge2.0-0t64 \
  libatk1.0-0t64 \
  libc6 \
  libcairo2 \
  libcups2t64 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc-s1 \
  libglib2.0-0t64 \
  libgtk-3-0t64 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  ca-certificates \
  fonts-liberation \
  xdg-utils
```

### Переменные окружения для PDF

Опционально:

```bash
BASE_URL=http://localhost:3000
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

Примечание:
- локально `BASE_URL` обычно не нужен (берётся из request origin)
- в production лучше задать явно

## H. Troubleshooting (типовые проблемы)

### 1) “Таблиц нет” / `relation ... does not exist`

Обычно:
- миграции не применены

Решение:

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

### 2) “Prisma client not generated” / отсутствуют новые модели в Prisma Client

Признаки:
- ошибки вида `prisma.variant is undefined`
- TS/runtime несоответствие новым моделям

Решение:

```bash
pnpm prisma generate
pnpm dev
```

### 3) `ECONNREFUSED` / Prisma не может подключиться к Postgres

Проверь:
- запущен ли контейнер:

```bash
docker compose ps
```

- совпадает ли порт в:
  - `docker-compose.yml`
  - `DATABASE_URL` в `.env` и `.env.local`

Текущая конфигурация проекта:
- compose публикует Postgres на `localhost:5433`

### 4) `Drift detected` / `migration history diverged`

Для локальной dev-базы (с потерей данных):

```bash
pnpm prisma migrate reset --force
pnpm prisma generate
```

### 5) PDF `501` / Chrome not found / missing libs

Частые случаи:
- `puppeteer is not installed`
  - `pnpm install`
- `Ignored build scripts: puppeteer`
  - `pnpm approve-builds`
  - `pnpm exec puppeteer browsers install chrome`
- `Could not find Chrome`
  - установить browser через puppeteer или задать `PUPPETEER_EXECUTABLE_PATH`
- `error while loading shared libraries`
  - поставить системные зависимости Chromium (см. раздел `G`)

Fallback для пользователя/разработчика всегда есть:
- открыть `/print` страницу
- сохранить через браузер в PDF

### 6) `/favicon.ico` вызывал краш главной страницы

Ранее запрос `GET /favicon.ico` мог попадать в маршрут `/{locale}` и ломать рендер.

Сейчас это исправлено guard-ом на локаль в `src/app/[locale]/page.tsx`.  
Если видите `GET /favicon.ico 404`, это обычно просто отсутствие `public/favicon.ico` (не критично).

## Полезные команды (чек-лист)

```bash
pnpm lint
pnpm typecheck
# pnpm test   # test script сейчас отсутствует
pnpm dev
```

Если трогали task bank:

```bash
pnpm validate:tasks
```
