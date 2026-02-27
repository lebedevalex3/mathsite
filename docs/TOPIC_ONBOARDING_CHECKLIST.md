# Topic Onboarding Checklist

Чек-лист для безопасного добавления новой темы в MathSite без разрывов между таксономией, контентом, задачами и teacher tools.

## 1. Таксономия и ID-контракт

1. Создать/обновить `docs/TAXONOMY*.md` для темы.
2. Зафиксировать `topic_id` и `skill_id` в стабильном формате.
3. Проверить mapping `skill_id -> subtopic_id`.
4. Не менять опубликованные `task_id`.

## 2. Контент (MDX)

1. Сгенерировать тему/подтемы:
```bash
pnpm content:new-topic -- --domain <domain> --topic <topic> --title "<title>" --level <grade> --locales ru,en,de
```
2. Для добавления подтем:
```bash
pnpm content:new-subtopic -- --topic <topic> --slug <slug> --title "<title>" --order <order>
```
3. Проверить `subtopicMeta` и TOC-якоря (`id`) в каждом MDX.
4. Запустить:
```bash
pnpm validate:content
```

## 3. Банк задач

1. Добавить задачи в `data/tasks/*.json`.
2. Сохранить стабильный формат:
   - `task_id`: `g<grade>.<topic>.<skill>.000001`
   - `statement_md`: Markdown + LaTeX
3. Проверить соответствие `skill_id` таксономии.
4. Запустить:
```bash
pnpm validate:tasks
```

## 4. Каталоги и навигация

1. Проверить/добавить тему в:
   - `src/lib/content/topic-registry.ts`
   - `src/lib/topicMeta.ts`
   - `src/lib/nav/grade5.ts` (или нужный grade nav)
   - `src/lib/topicMastery.ts`
2. Проверить локализованные title/description/search terms.

## 5. Teacher Tools и шаблоны

1. Добавить шаблоны вариантов в `templates/variants/...`.
2. Проверить совместимость генератора для новых `skill_id`.
3. Проверить страницы:
   - `/{locale}/teacher/variants`
   - `/{locale}/teacher/variants/{id}`
   - print/answers print

## 6. Quality Gates (обязательно перед merge)

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm validate:tasks
pnpm validate:content
pnpm dev
```

Smoke-маршруты:
- `/ru`
- `/ru/progress`
- `/ru/teacher/variants`
- `/api/progress?topicId=<topic_id>`

## 7. Документация

1. Обновить `README.md` при изменении основных flow.
2. Обновить `CONTENT_GUIDE.md`, если меняется workflow контента.
3. Обновить `LOCAL_DEV.md`, если меняется локальный setup.
