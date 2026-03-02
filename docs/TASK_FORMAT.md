# Формат банка задач (MVP)

Банк задач хранится в `data/tasks/**/*.json`.

## Формат файла

Один JSON-файл содержит задачи по одной теме.

```json
{
  "schema_version": 1,
  "topic_id": "math.proportion",
  "section_id": "math.arithmetic",
  "module_id": "math.arithmetic.proportion",
  "grade_tags": [5, 6],
  "title": "Пропорции (5 класс): стартовый банк",
  "tasks": [
    {
      "id": "math.proportion.find_unknown_term.000001",
      "topic_id": "math.proportion",
      "skill_id": "math.proportion.find_unknown_term",
      "difficulty": 2,
      "statement_md": "Найди $x$: $$\\\\frac{x}{3}=\\\\frac{8}{12}$$",
      "answer": { "type": "number", "value": 2 }
    }
  ]
}
```

## Поля задачи

- `id`: стабильный `task_id`, уникальный во всех JSON-файлах
- `topic_id`: `<namespace>.<topic_slug>` (например, `math.proportion`, `math.negative_numbers`)
- `skill_id`: один из `skill_id` из соответствующего файла `docs/TAXONOMY*.md`
- `difficulty`: целое число от `1` до `5`
- `statement_md`: непустой Markdown-текст (можно использовать LaTeX)
- `answer`: один из поддерживаемых форматов (см. ниже)

## Поля банка

- `section_id`: раздел курса (например, `math.arithmetic`, `math.algebra`)
- `module_id`: модуль внутри раздела (например, `math.arithmetic.proportion`)
- `grade_tags`: список классов-тегов, где материал релевантен (например, `[5, 6]`)
- `section_id/module_id/grade_tags` должны совпадать с метаданными темы в `docs/TAXONOMY*.md`

## Ответ

Поддерживаемые форматы:

```json
{ "type": "number", "value": 12 }
```

```json
{ "type": "fraction", "numerator": 3, "denominator": 4 }
```

```json
{ "type": "ratio", "left": 3, "right": 4 }
```

Примечание:
- для `fraction.denominator` и `ratio.right` значение `0` запрещено;
- в тренажёре пропорций `fraction/ratio` проверяются по эквивалентности (например, `3:4` и `6:8` считаются верными).

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
- соответствие `skill_id` таксономии `docs/TAXONOMY*.md`
- матрица покрытия `skill × difficulty × task_count` по правилам из `scripts/task-coverage.config.ts`
  - приоритет правил: `skill_id -> topic_id -> default`

После запуска формируются отчёты:

- `reports/task-coverage-matrix.json`
- `reports/task-coverage-matrix.md`

Если в обязательной ячейке матрицы задач меньше минимума, `pnpm validate:tasks` завершится с ошибкой.

## Как безопасно добавлять задачи (README notes)

1. Возьмите существующий `skill_id` из `docs/TAXONOMY.md`.
2. Создайте новый `task_id` с тем же `skill_id` и новым 6-значным номером.
3. Не меняйте старые `id` после коммита.
4. Держите `statement_md` коротким и однозначным; единицы измерения указывайте явно.
5. Для формул используйте LaTeX (`$...$` или `$$...$$`).
6. После изменений запускайте `pnpm validate:tasks` перед коммитом.
