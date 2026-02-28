# Branches Concept (MVP)

Документ фиксирует, как в теме используются `branches` (ветки навыков) без изменения базовой логики `skill progress`.

## Цель

`Branch` — смысловая надстройка над `skill`:

1. Группирует навыки в учебные треки.
2. Задает рекомендуемый порядок освоения.
3. Дает агрегированный прогресс на уровне ветки.

При этом:
- `attempts`, `progress`, `badges`, `task generation` остаются на уровне `skill`.
- Ветки не требуют новой БД/миграций в MVP.

## Текущая реализация

Источник данных:
- `src/lib/topics/proportion/module-data.ts`

Ключевые сущности:
- `ProportionBranch`
- `proportionBranches`
- `getProportionBranchValidationErrors()`

Рендер:
- `src/components/topic/ProportionTrainerSkillGrid.tsx`

## Модель ветки

```ts
type ProportionBranch = {
  id: "O" | "P" | "E" | "T" | "A";
  order: number;
  title: { ru: string; en: string; de: string };
  goal: { ru: string; en: string; de: string };
  skillIds: string[];
  optional?: boolean;
  dependsOn?: Array<"O" | "P" | "E" | "T" | "A">;
};
```

## Правила

1. `skillIds` в ветках должны ссылаться только на существующие `proportionSkills`.
2. Один `skillId` желательно держать в одной ветке (чтобы не дублировать прогресс).
3. `dependsOn` в MVP — только метаданные (без блокировки UI).
4. При ошибке конфигурации веток UI обязан иметь fallback на старые секции.

## Как добавить новую ветку

1. Добавить ветку в `proportionBranches`:
   - `id`, `order`, `title`, `goal`, `skillIds`.
2. Проверить, что все `skillIds` существуют в `proportionSkills`.
3. Убедиться, что страница `/{locale}/topics/proportion/trainer`:
   - показывает новую ветку;
   - считает `Освоено X/Y` корректно.

## Что не делаем в MVP

1. Не добавляем отдельные API/таблицы под ветки.
2. Не вводим строгие prerequisites (hard lock).
3. Не меняем маршруты и task-bank формат.
