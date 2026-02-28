# Формат банка задач (MVP)

Банк задач хранится в `data/tasks/**/*.json`.

## Формат файла

Один JSON-файл содержит задачи по одной теме.

```json
{
  "schema_version": 1,
  "topic_id": "math.proportion",
  "title": "Пропорции (5 класс): стартовый банк",
  "tasks": [
    {
      "id": "math.proportion.find_unknown_extreme.000001",
      "topic_id": "math.proportion",
      "skill_id": "math.proportion.find_unknown_extreme",
      "difficulty": 2,
      "statement_md": "Найди $x$: $$\\\\frac{x}{3}=\\\\frac{8}{12}$$",
      "answer": { "type": "number", "value": 2 }
    }
  ]
}
```

## Поля задачи

- `id`: стабильный `task_id`, уникальный во всех JSON-файлах
- `topic_id`: `g<класс>.<topic_slug>` (например, `math.proportion`, `math.negative_numbers`)
- `skill_id`: один из `skill_id` из соответствующего файла `docs/TAXONOMY*.md`
- `difficulty`: целое число от `1` до `5`
- `statement_md`: непустой Markdown-текст (можно использовать LaTeX)
- `answer`: пока только число

## Ответ (MVP)

Пока поддерживается только этот формат:

```json
{ "type": "number", "value": 12 }
```

## Валидация

Команда проверки:

```bash
pnpm validate:tasks
```

Что проверяется:

- JSON и схема файла
- схема каждой задачи
- уникальность `task.id` во всех файлах
- диапазон `difficulty` (`1..5`)
- непустой `statement_md`

## Как безопасно добавлять задачи (README notes)

1. Возьмите существующий `skill_id` из `docs/TAXONOMY.md`.
2. Создайте новый `task_id` с тем же `skill_id` и новым 6-значным номером.
3. Не меняйте старые `id` после коммита.
4. Держите `statement_md` коротким и однозначным; единицы измерения указывайте явно.
5. Для формул используйте LaTeX (`$...$` или `$$...$$`).
6. После изменений запускайте `pnpm validate:tasks` перед коммитом.
