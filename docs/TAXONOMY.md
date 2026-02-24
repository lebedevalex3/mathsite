# Таксономия (MVP): Пропорции, 5 класс

## Topic

- `topic_id`: `g5.proporcii`
- Название: `Пропорции`
- Класс: `5`

## Skill IDs (операции)

Ниже перечислены стабильные `skill_id` для задач по теме. В MVP можно наполнять задачи постепенно.

- `g5.proporcii.raspoznat_proporciyu` — распознать, является ли запись пропорцией
- `g5.proporcii.proverit_proporciyu` — проверить пропорцию по основному свойству
- `g5.proporcii.naiti_neizvestnyi_krainei` — найти неизвестный крайний член пропорции
- `g5.proporcii.naiti_neizvestnyi_srednii` — найти неизвестный средний член пропорции
- `g5.proporcii.sostavit_proporciyu_po_usloviyu` — составить пропорцию по текстовому условию
- `g5.proporcii.preobrazovat_otnoshenie` — привести отношение к удобному виду
- `g5.proporcii.reshit_zadachu_na_masshtab` — задачи на масштаб
- `g5.proporcii.reshit_zadachu_na_cenu` — задачи на цену/стоимость
- `g5.proporcii.reshit_zadachu_na_proizvoditelnost` — задачи на одинаковую производительность
- `g5.proporcii.primenit_svoistvo_proporcii` — применять свойство `ad = bc` в вычислениях

## Subtopics (подтемы модуля)

- `subtopic_id`: `g5.proporcii.rule`
  - slug: `rule`
  - Заголовок: `Основное правило пропорции`
  - Описание: основное свойство пропорции, проверка и поиск неизвестного члена
- `subtopic_id`: `g5.proporcii.direct`
  - slug: `direct`
  - Заголовок: `Прямая пропорциональность`
  - Описание: зависимость величин, где при увеличении одной величины увеличивается и другая
- `subtopic_id`: `g5.proporcii.inverse`
  - slug: `inverse`
  - Заголовок: `Обратная пропорциональность`
  - Описание: зависимость величин, где при увеличении одной величины другая уменьшается
- `subtopic_id`: `g5.proporcii.problems`
  - slug: `problems`
  - Заголовок: `Задачи на пропорции`
  - Описание: текстовые задачи на масштаб, цену, производительность и составление пропорций

## Mapping: skill_id -> subtopic_id

- `g5.proporcii.raspoznat_proporciyu` -> `g5.proporcii.rule`
- `g5.proporcii.proverit_proporciyu` -> `g5.proporcii.rule`
- `g5.proporcii.naiti_neizvestnyi_krainei` -> `g5.proporcii.rule`
- `g5.proporcii.naiti_neizvestnyi_srednii` -> `g5.proporcii.rule`
- `g5.proporcii.primenit_svoistvo_proporcii` -> `g5.proporcii.rule`
- `g5.proporcii.preobrazovat_otnoshenie` -> `g5.proporcii.direct`
- `g5.proporcii.sostavit_proporciyu_po_usloviyu` -> `g5.proporcii.direct`
- `g5.proporcii.reshit_zadachu_na_masshtab` -> `g5.proporcii.problems`
- `g5.proporcii.reshit_zadachu_na_cenu` -> `g5.proporcii.problems`
- `g5.proporcii.reshit_zadachu_na_proizvoditelnost` -> `g5.proporcii.inverse`

## Правила стабильности ID

- `topic_id` фиксирован для этой темы: `g5.proporcii`
- `skill_id` формат: `g5.proporcii.<operation_name>`
- `task_id` формат: `g5.proporcii.<skill>.000001` (ровно 6 цифр в конце)
- После публикации `task_id` не переиспользуется и не меняется
