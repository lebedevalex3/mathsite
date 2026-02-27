# MathSite

MathSite is a school math platform built with Next.js, MDX, KaTeX, and Postgres.

Current MVP focus:
- SEO textbook for grade 5 (`Пропорции`)
- task bank in JSON (`statement_md` as Markdown + LaTeX)
- student progress via attempts/progress APIs
- teacher tools for worksheet variants and print/PDF
- locales: `ru`, `en`, `de` (routes under `/{locale}`)

## Tech Stack

- Next.js App Router + TypeScript
- Prisma + Postgres
- MDX + KaTeX
- Node test runner (`node --test`)

## Quick Start

1. Start Postgres:
```bash
docker compose up -d
```
2. Install dependencies:
```bash
pnpm install
```
3. Prepare environment:
```bash
cp .env.example .env.local
cp .env.local .env
```
4. Apply migrations and generate Prisma client:
```bash
pnpm prisma migrate dev
pnpm prisma generate
```
5. Start dev server:
```bash
pnpm dev
```

Detailed local setup and troubleshooting: [LOCAL_DEV.md](./LOCAL_DEV.md).

## Main Paths

- Student home: `http://localhost:3000/ru`
- Topic: `http://localhost:3000/ru/5-klass/proporcii`
- Progress: `http://localhost:3000/ru/progress`
- Teacher variants: `http://localhost:3000/ru/teacher/variants`

## Content And Task Contracts

- Taxonomy docs: `docs/TAXONOMY*.md`
- Task format: `docs/TASK_FORMAT.md`
- Task bank location: `data/tasks/**/*.json`
- Content location: `content/**`

Hard constraints:
- stable IDs (`topic_id`, `skill_id`, `task_id`) must not be rewritten after publication
- formulas are Markdown + LaTeX (`$...$`, `$$...$$`)
- any task bank change must pass validation

## Contributing Flow

1. Implement a small vertical slice.
2. Update docs if taxonomy/format contracts changed.
3. Run required checks before commit:
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm dev
```
4. If tasks were changed, also run:
```bash
pnpm validate:tasks
```

## Scripts

- `pnpm dev` - run local app
- `pnpm lint` - eslint
- `pnpm typecheck` - TypeScript checks
- `pnpm test` - test suite
- `pnpm validate:tasks` - task bank validation
- `pnpm validate:content` - content validation
