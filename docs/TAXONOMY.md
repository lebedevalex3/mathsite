# Таксономия (MVP): Пропорции, 5 класс

## Topic

- `topic_id`: `math.proportion`
- Название: `Пропорции`
- Класс: `5`

## Skill IDs (операции)

На текущем этапе в теме активны девять навыков:

- `math.proportion.understand_ratio_as_quotient` — понимать отношение как частное
- `math.proportion.transform_ratio` — упрощать отношение
- `math.proportion.compare_ratio_multiples` — находить, во сколько раз одна величина больше/меньше другой
- `math.proportion.part_of_whole_as_ratio` — находить долю от целого как отношение
- `math.proportion.recognize_proportion` — распознавать и дополнять пропорции
- `math.proportion.check_proportion` — проверять пропорцию по определению
- `math.proportion.apply_proportion_property` — проверять пропорцию по основному свойству
- `math.proportion.solve_hidden_linear_fraction` — решать пропорции, замаскированные под линейные дроби
- `math.proportion.find_unknown_term` — находить неизвестный член пропорции

## Subtopics (подтемы модуля)

- `subtopic_id`: `math.proportion.direct`
  - slug: `direct`
  - Заголовок: `Прямая пропорциональность`
  - Описание: зависимость величин, где при увеличении одной величины увеличивается и другая
- `subtopic_id`: `math.proportion.rule`
  - slug: `rule`
  - Заголовок: `Свойства пропорции`
  - Описание: проверка и преобразование пропорций по определению и свойству
- `subtopic_id`: `math.proportion.problems`
  - slug: `problems`
  - Заголовок: `Текстовые и скрытые пропорции`
  - Описание: применение пропорций в задачах и нестандартных формах записи

## Mapping: skill_id -> subtopic_id

- `math.proportion.understand_ratio_as_quotient` -> `math.proportion.direct`
- `math.proportion.transform_ratio` -> `math.proportion.direct`
- `math.proportion.compare_ratio_multiples` -> `math.proportion.direct`
- `math.proportion.part_of_whole_as_ratio` -> `math.proportion.direct`
- `math.proportion.recognize_proportion` -> `math.proportion.rule`
- `math.proportion.check_proportion` -> `math.proportion.rule`
- `math.proportion.apply_proportion_property` -> `math.proportion.rule`
- `math.proportion.solve_hidden_linear_fraction` -> `math.proportion.problems`
- `math.proportion.find_unknown_term` -> `math.proportion.rule`

## Правила стабильности ID

- `topic_id` фиксирован для этой темы: `math.proportion`
- `skill_id` формат: `math.proportion.<operation_name>`
- `task_id` формат: `math.proportion.<skill>.000001` (ровно 6 цифр в конце)
- После публикации `task_id` не переиспользуется и не меняется
