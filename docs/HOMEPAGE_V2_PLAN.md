# Homepage V2 Plan

План этапа 1: зафиксировать структуру и тексты главной страницы до UI-реализации.

## Цель

Сместить акцент главной с “генератора как единственного центра” на два пользовательских маршрута:
- ученик: начать/продолжить обучение;
- учитель: быстро собрать вариант и перейти в кабинет.

## Карта секций (порядок сверху вниз)

1. `Hero + Role Split`
2. `Continue` (персональный блок продолжения)
3. `Topic Catalog` (главный каталог тем)
4. `Teacher Quick Start` (компактный конструктор)
5. `How It Works (3 steps)`
6. `Trust / KPI` (цифры продукта)

## Секция 1: Hero + Role Split

Назначение:
- за 3-5 секунд объяснить продукт;
- развести потоки “ученик” и “учитель”.

Контент:
- Заголовок: “Учебник, тренажёр и варианты по математике”
- Подзаголовок: “Выберите сценарий и начните за 1 минуту”
- 2 CTA:
  - primary: ученик;
  - secondary: учитель.

## Секция 2: Continue

Назначение:
- вернуть пользователя в ближайшее полезное действие.

Состояния:
- есть прогресс: показать тему, прогресс, кнопку “продолжить”;
- нет прогресса: показать “начать с основ”.

## Секция 3: Topic Catalog

Назначение:
- сделать каталог тем центром навигации.

Карточка темы:
- класс;
- статус (`ready` / `soon`);
- короткое описание;
- CTA: открыть тему / тренажёр.

## Секция 4: Teacher Quick Start

Назначение:
- сократить путь учителя к сборке варианта.

Контент:
- тема + режим;
- одна главная кнопка “Собрать вариант”;
- 3 value points: без повторов, ключ ответов, печать/PDF.

## Секция 5: How It Works (3 steps)

Назначение:
- коротко объяснить путь без повторения деталей.

Шаги:
1. Открыть тему.
2. Тренироваться по навыкам.
3. Собрать и распечатать вариант (для учителя).

## Секция 6: Trust / KPI

Назначение:
- дать ощущение масштаба и надежности.

Плановые метрики для отображения:
- количество задач;
- количество тем;
- поддерживаемые языки;
- стабильность (тесты/валидация).

## CTA Copy (ru/en/de)

### RU
- Hero primary: `Я ученик`
- Hero secondary: `Я учитель`
- Continue primary: `Продолжить тренажёр`
- Continue empty: `Начать с основ`
- Catalog card: `Открыть тему`
- Catalog trainer: `Тренажёр`
- Teacher quick start: `Собрать вариант`

### EN
- Hero primary: `I am a student`
- Hero secondary: `I am a teacher`
- Continue primary: `Continue training`
- Continue empty: `Start with basics`
- Catalog card: `Open topic`
- Catalog trainer: `Trainer`
- Teacher quick start: `Build worksheet`

### DE
- Hero primary: `Ich bin Schüler/in`
- Hero secondary: `Ich bin Lehrkraft`
- Continue primary: `Training fortsetzen`
- Continue empty: `Mit Grundlagen starten`
- Catalog card: `Thema öffnen`
- Catalog trainer: `Trainer`
- Teacher quick start: `Arbeitsblatt erstellen`

## Навигационные цели CTA

- `Я ученик` -> `/{locale}/5-klass/proporcii`
- `Я учитель` -> `/{locale}/teacher/variants`
- `Продолжить тренажёр` -> последний активный trainer route
- `Собрать вариант` -> `/{locale}/teacher/variants` (с предзаполнением параметров, если доступны)

## KPI этапа реализации (для следующих этапов)

- `hero_student_click_rate`
- `hero_teacher_click_rate`
- `continue_click_rate`
- `catalog_topic_open_rate`
- `teacher_quick_start_rate`

## Критерии готовности этапа 1

- структура секций и порядок зафиксированы;
- тексты CTA согласованы на `ru/en/de`;
- целевые маршруты CTA заданы;
- метрики для последующей аналитики перечислены.
