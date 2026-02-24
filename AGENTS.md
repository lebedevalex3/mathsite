# Project: MathSite (school math)

## Product/MVP

- SEO учебник по математике (MVP: 5 класс, тема "Пропорции")
- Учебник: MDX + KaTeX
- Банк задач: JSON (statement_md = markdown + LaTeX), ответы в JSON
- Пользовательские данные: Postgres (attempts, progress)
- Роли: student, teacher, admin
- i18n: ru, en, de (URL: /ru, /en, /de)

## Hard constraints (DO NOT BREAK)

- IDs are stable:
  - topic_id: g5.proporcii
  - skill_id: g5.proporcii.find_unknown_term
  - task_id: g5.proporcii.find_unknown_term.000123
- Math is written as Markdown with LaTeX ($...$, $$...$$).
- Any change to task bank must pass validation script.
- No Moodle integration in MVP.
- No chat/video/manual grading/complex analytics in MVP.

## Commands (must run before finishing a task)

- pnpm lint
- pnpm typecheck
- pnpm test (if exists)
- pnpm dev (smoke)
- pnpm validate:tasks (when tasks are touched)

## Working style

- Small vertical slices only.
- Prefer minimal dependencies.
- Update docs/\* when taxonomy or formats change.
