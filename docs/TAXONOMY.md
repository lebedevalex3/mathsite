# Таксономия (MVP): Пропорции, 5 класс

## Topic

- `topic_id`: `math.proportion`
- Название: `Пропорции`
- Класс: `5`

## Skill IDs (операции)

Ниже перечислены стабильные `skill_id` для задач по теме. В MVP можно наполнять задачи постепенно.

- `math.proportion.recognize_proportion` — распознать, является ли запись пропорцией
- `math.proportion.check_proportion` — проверить пропорцию по основному свойству
- `math.proportion.find_unknown_extreme` — найти неизвестный крайний член пропорции
- `math.proportion.find_unknown_middle` — найти неизвестный средний член пропорции
- `math.proportion.build_proportion_from_text` — составить пропорцию по текстовому условию
- `math.proportion.transform_ratio` — привести отношение к удобному виду
- `math.proportion.solve_scale_word_problem` — задачи на масштаб
- `math.proportion.solve_price_word_problem` — задачи на цену/стоимость
- `math.proportion.solve_productivity_word_problem` — задачи на одинаковую производительность
- `math.proportion.apply_proportion_property` — применять свойство `ad = bc` в вычислениях

## Subtopics (подтемы модуля)

- `subtopic_id`: `math.proportion.rule`
  - slug: `rule`
  - Заголовок: `Основное правило пропорции`
  - Описание: основное свойство пропорции, проверка и поиск неизвестного члена
- `subtopic_id`: `math.proportion.direct`
  - slug: `direct`
  - Заголовок: `Прямая пропорциональность`
  - Описание: зависимость величин, где при увеличении одной величины увеличивается и другая
- `subtopic_id`: `math.proportion.inverse`
  - slug: `inverse`
  - Заголовок: `Обратная пропорциональность`
  - Описание: зависимость величин, где при увеличении одной величины другая уменьшается
- `subtopic_id`: `math.proportion.problems`
  - slug: `problems`
  - Заголовок: `Задачи на пропорции`
  - Описание: текстовые задачи на масштаб, цену, производительность и составление пропорций

## Mapping: skill_id -> subtopic_id

- `math.proportion.recognize_proportion` -> `math.proportion.rule`
- `math.proportion.check_proportion` -> `math.proportion.rule`
- `math.proportion.find_unknown_extreme` -> `math.proportion.rule`
- `math.proportion.find_unknown_middle` -> `math.proportion.rule`
- `math.proportion.apply_proportion_property` -> `math.proportion.rule`
- `math.proportion.transform_ratio` -> `math.proportion.direct`
- `math.proportion.build_proportion_from_text` -> `math.proportion.direct`
- `math.proportion.solve_scale_word_problem` -> `math.proportion.problems`
- `math.proportion.solve_price_word_problem` -> `math.proportion.problems`
- `math.proportion.solve_productivity_word_problem` -> `math.proportion.inverse`

## Правила стабильности ID

- `topic_id` фиксирован для этой темы: `math.proportion`
- `skill_id` формат: `math.proportion.<operation_name>`
- `task_id` формат: `math.proportion.<skill>.000001` (ровно 6 цифр в конце)
- После публикации `task_id` не переиспользуется и не меняется
