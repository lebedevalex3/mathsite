# Таксономия (MVP): Пропорции, 5 класс

## Topic

- `topic_id`: `math.proportion`
- Название: `Пропорции`
- Класс: `5`

## Skill IDs (операции)

На текущем этапе в теме активны три навыка:

- `math.proportion.understand_ratio_as_quotient` — понимать отношение как частное
- `math.proportion.transform_ratio` — упрощать отношение
- `math.proportion.compare_ratio_multiples` — находить, во сколько раз одна величина больше/меньше другой

## Subtopics (подтемы модуля)

- `subtopic_id`: `math.proportion.direct`
  - slug: `direct`
  - Заголовок: `Прямая пропорциональность`
  - Описание: зависимость величин, где при увеличении одной величины увеличивается и другая

## Mapping: skill_id -> subtopic_id

- `math.proportion.understand_ratio_as_quotient` -> `math.proportion.direct`
- `math.proportion.transform_ratio` -> `math.proportion.direct`
- `math.proportion.compare_ratio_multiples` -> `math.proportion.direct`

## Правила стабильности ID

- `topic_id` фиксирован для этой темы: `math.proportion`
- `skill_id` формат: `math.proportion.<operation_name>`
- `task_id` формат: `math.proportion.<skill>.000001` (ровно 6 цифр в конце)
- После публикации `task_id` не переиспользуется и не меняется
