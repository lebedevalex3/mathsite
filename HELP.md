# HELP: быстрый запуск MathSite после клонирования

Этот файл для разработчика, который только что скачал репозиторий и хочет сразу поднять проект локально.

## 1) Требования

- Node.js `20+`
- `pnpm`
- Docker + `docker compose`

Проверка:

```bash
node -v
pnpm -v
docker -v
docker compose version
```

## 2) Клонирование и установка

```bash
git clone https://github.com/<your-username>/mathsite.git
cd mathsite
pnpm install
```

## 3) Поднять Postgres

```bash
docker compose up -d
docker compose ps
```

В проекте БД проброшена на порт `5433` (см. `docker-compose.yml`).

## 4) Настроить env

```bash
cp .env.example .env.local
cp .env.local .env
```

Проверьте, что в `.env` и `.env.local`:

```bash
DATABASE_URL="postgresql://mathsite:mathsite@localhost:5433/mathsite?schema=public"
```

Опционально для локального dev:

```bash
ALLOW_DEV_BECOME_TEACHER=1
```

## 5) Применить миграции Prisma

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

## 6) Запустить приложение

```bash
pnpm dev
```

Открыть:

- `http://localhost:3000/ru`
- `http://localhost:3000/api/health`

## 7) Быстрая проверка, что всё ок

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Если меняли банк задач:

```bash
pnpm validate:tasks
```

## Частые проблемы

### Ошибка подключения к БД

- Убедитесь, что контейнер `mathsite-postgres` в `Up`
- Проверьте `DATABASE_URL` и порт `5433`

### Prisma пишет drift/diverge

Для локальной базы (с потерей данных):

```bash
pnpm prisma migrate reset --force
pnpm prisma generate
```

### `Too many demo generation requests`

Сработал rate limit генератора демо-вариантов. Подождите несколько минут или очистите старые демо-работы.

## Полезные документы

- `README.md`
- `LOCAL_DEV.md`
- `docs/LOCAL_DEV.md`
