# Пропорции: добавить 1 навык за 5 минут

Короткий рабочий шаблон для темы `g5.proporcii`.

## Что считается навыком

Навык = стабильный `skill_id` + метаданные для UI + минимум 10 задач в банке.

## Быстрый чек-лист (5 минут)

1. Добавь `skill_id` в таксономию:
   - `docs/TAXONOMY.md`
2. Добавь метаданные навыка:
   - `src/lib/topics/proporcii/module-data.ts`
3. Добавь задачи навыка (минимум 10):
   - `data/tasks/proporcii.json`
4. (Опционально, но обычно нужно) добавь навык в группировки UI:
   - `src/components/topic/ProporciiTrainerSkillGrid.tsx`
   - `src/lib/topicMastery.ts`
5. Запусти проверки:
   - `pnpm validate:tasks`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm dev` (smoke)

## Шаблон `skill_id`

Формат:

```text
g5.proporcii.<operation_name>
```

Пример:

```text
g5.proporcii.sravnit_dve_proporcii
```

## Шаг 1. Таксономия

В `docs/TAXONOMY.md` добавь:

1. В список `Skill IDs`
2. В `Mapping: skill_id -> subtopic_id`

Пример строки:

```md
- `g5.proporcii.sravnit_dve_proporcii` — сравнить две пропорции
```

## Шаг 2. Метаданные навыка (UI)

В `src/lib/topics/proporcii/module-data.ts` добавь объект в `proporciiSkills`:

```ts
{
  id: "g5.proporcii.sravnit_dve_proporcii",
  title: "Сравнить две пропорции",
  summary: "Сравнить два равенства отношений и определить, эквивалентны ли они.",
  subtopicId: "g5.proporcii.rule",
  skillSlug: "naiti-neizvestnyi",
}
```

Примечания:
- `id` должен совпадать с таксономией 1:1.
- `subtopicId` должен быть валидным (`rule | direct | inverse | problems`).
- `title/summary` — то, что увидит ученик на карточке.

## Шаг 3. Задачи в банке

В `data/tasks/proporcii.json` добавь минимум 10 задач для нового `skill_id`.

Шаблон задачи:

```json
{
  "id": "g5.proporcii.sravnit_dve_proporcii.000001",
  "topic_id": "g5.proporcii",
  "skill_id": "g5.proporcii.sravnit_dve_proporcii",
  "difficulty": 2,
  "statement_md": "Сравни: $$\\\\frac{2}{3}=\\\\frac{4}{6}$$ и $$\\\\frac{3}{5}=\\\\frac{6}{10}$$. Ответ: 1, если обе верны, иначе 0.",
  "answer": { "type": "number", "value": 1 }
}
```

Правила:
- `task_id` формат: `g5.proporcii.<skill>.000001` (6 цифр).
- Не переиспользуй старые `id`.
- `statement_md` можно с LaTeX (`$...$`, `$$...$$`).
- `difficulty` только `1..5`.

## Шаг 4. Чтобы навык появился в нужных местах

Обычно нужно добавить `skill_id` в:

- `src/components/topic/ProporciiTrainerSkillGrid.tsx` (секция и порядок карточек)
- `src/lib/topicMastery.ts` (уровни освоения на карте/прогрессе)

Если это не сделать, навык может быть в банке, но отображаться не там, где ожидается.

## Шаг 5. Definition of Done

Навык считается добавленным, если:

1. `pnpm validate:tasks` = OK
2. На странице `/{locale}/topics/proporcii/trainer` видна карточка навыка
3. Открывается `/{locale}/topics/proporcii/train?skill=<skill_id>`
4. Есть минимум 10 задач, серия запускается без ошибки "недостаточно задач"

## Мини-шаблон для PR/коммита

```text
feat(proporcii): add skill g5.proporcii.<operation_name>

- taxonomy: added skill_id and subtopic mapping
- module-data: added UI metadata
- task bank: added 10+ tasks
- trainer/mastery grouping: updated
```
