# Пропорции: добавить 1 навык за 5 минут

Короткий рабочий шаблон для темы `math.proportion`.

## Что считается навыком

Навык = стабильный `skill_id` + метаданные для UI + минимум 10 задач в банке.

## Быстрый чек-лист (5 минут)

0. (Быстрее всего) запусти скрипт добавления навыка:
   - `pnpm proportion:add-skill -- --operation understand_ratio_as_quotient --title "Понимать отношение как частное" --summary "Записывать отношение a:b как a/b и находить его значение." --taxonomy-description "понимать отношение как частное" --subtopic direct --branch O --tasks 10`
   - Скрипт сам обновит:
     - `docs/TAXONOMY.md`
     - `src/lib/topics/proportion/module-data.ts`
     - `data/tasks/proportion.json` (создаст `TODO`-задачи)
1. Дополни `TODO`-задачи реальными формулировками и ответами:
   - `data/tasks/proportion.json`
2. (Опционально, но обычно нужно) добавь навык в группировки UI:
   - `src/components/topic/ProportionTrainerSkillGrid.tsx`
   - `src/lib/topicMastery.ts`
3. Запусти проверки:
   - `pnpm validate:tasks`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm dev` (smoke)

## Команда скрипта

```bash
pnpm proportion:add-skill -- \
  --operation understand_ratio_as_quotient \
  --title "Понимать отношение как частное" \
  --summary "Записывать отношение a:b как a/b и находить его значение." \
  --taxonomy-description "понимать отношение как частное" \
  --subtopic direct \
  --branch O \
  --tasks 10
```

Параметры:
- `--operation` обязательный, только english snake_case
- `--title` обязательный, название карточки навыка
- `--summary` обязательный, описание карточки
- `--taxonomy-description` опционально, текст после `—` в `TAXONOMY.md`
- `--subtopic` опционально: `direct|rule|inverse|problems` (по умолчанию `direct`)
- `--branch` опционально: `O|P|E|T|A` (по умолчанию `O`)
- `--tasks` опционально: число заготовок задач (по умолчанию `10`)

## Шаблон `skill_id`

Формат:

```text
math.proportion.<operation_name>
```

Пример:

```text
math.proportion.compare_two_proportions
```

## Шаг 1. Таксономия

В `docs/TAXONOMY.md` добавь:

1. В список `Skill IDs`
2. В `Mapping: skill_id -> subtopic_id`

Пример строки:

```md
- `math.proportion.compare_two_proportions` — сравнить две пропорции
```

## Шаг 2. Метаданные навыка (UI)

В `src/lib/topics/proportion/module-data.ts` добавь объект в `proportionSkills`:

```ts
{
  id: "math.proportion.compare_two_proportions",
  title: "Сравнить две пропорции",
  summary: "Сравнить два равенства отношений и определить, эквивалентны ли они.",
  subtopicId: "math.proportion.rule",
  skillSlug: "find-unknown",
}
```

Примечания:
- `id` должен совпадать с таксономией 1:1.
- `subtopicId` должен быть валидным (`rule | direct | inverse | problems`).
- `title/summary` — то, что увидит ученик на карточке.

## Шаг 3. Задачи в банке

В `data/tasks/proportion.json` добавь минимум 10 задач для нового `skill_id`.

Шаблон задачи:

```json
{
  "id": "math.proportion.compare_two_proportions.000001",
  "topic_id": "math.proportion",
  "skill_id": "math.proportion.compare_two_proportions",
  "difficulty": 2,
  "statement_md": "Сравни: $$\\\\frac{2}{3}=\\\\frac{4}{6}$$ и $$\\\\frac{3}{5}=\\\\frac{6}{10}$$. Ответ: 1, если обе верны, иначе 0.",
  "answer": { "type": "number", "value": 1 }
}
```

Правила:
- `task_id` формат: `math.proportion.<skill>.000001` (6 цифр).
- Не переиспользуй старые `id`.
- `statement_md` можно с LaTeX (`$...$`, `$$...$$`).
- `difficulty` только `1..5`.

## Шаг 4. Чтобы навык появился в нужных местах

Обычно нужно добавить `skill_id` в:

- `src/components/topic/ProportionTrainerSkillGrid.tsx` (секция и порядок карточек)
- `src/lib/topicMastery.ts` (уровни освоения на карте/прогрессе)

Если это не сделать, навык может быть в банке, но отображаться не там, где ожидается.

## Шаг 5. Definition of Done

Навык считается добавленным, если:

1. `pnpm validate:tasks` = OK
2. На странице `/{locale}/topics/proportion/trainer` видна карточка навыка
3. Открывается `/{locale}/topics/proportion/train?skill=<skill_id>`
4. Есть минимум 10 задач, серия запускается без ошибки "недостаточно задач"

## Мини-шаблон для PR/коммита

```text
feat(proportion): add skill math.proportion.<operation_name>

- taxonomy: added skill_id and subtopic mapping
- module-data: added UI metadata
- task bank: added 10+ tasks
- trainer/mastery grouping: updated
```
