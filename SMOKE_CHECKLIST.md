# Smoke Checklist (Pre/Post Deploy)

Короткий чеклист, чтобы быстро поймать типовые поломки перед деплоем и сразу после деплоя.

Подходит для:
- pre-deploy (staging/local final check)
- post-deploy (production smoke)

Подробные инструкции:
- локальный запуск и Prisma: `LOCAL_DEV.md`
- PDF/Chromium setup и диагностика: `OPS_PDF.md`

## A. Когда запускать

- **Перед деплоем**: после миграций/изменений API/teacher flow/PDF
- **После деплоя**: после выкладки и применения миграций

## B. Минимальные предпосылки

Перед проверкой убедитесь, что:
- приложение запущено (`pnpm dev` локально или production service online)
- Postgres доступен
- Prisma миграции применены
- для Teacher flow есть пользователь с ролью `teacher`/`admin`
- для dev-only `POST /api/teacher/become` включён `ALLOW_DEV_BECOME_TEACHER=1` (только если нужно получить роль локально)

## C. Checklist (действие -> ожидаемый результат)

Проверки ниже можно выполнить на `/ru`. Для `/en` и `/de` достаточно короткого sanity-check (см. пункт 8).

### 1. DB / Migrations

Действие (локально):

```bash
pnpm prisma migrate status
```

Ожидаемый результат:
- Prisma видит datasource
- нет `drift` / `diverged`
- миграции применены (или статус без критических ошибок)

Доп. проверка подключения к БД:

```bash
docker compose ps
cat .env | grep DATABASE_URL
```

### 2. Attempts (тренажёр / `POST /api/attempts`)

Рекомендуемый путь (UI):
1. Открыть:
   - `http://localhost:3000/ru/5-klass/proportion/train?skill=math.proportion.find_unknown_term`
2. Решить задачу и нажать `Check`

Ожидаемый результат:
- UI не падает
- попытка принимается (в норме запрос `POST /api/attempts` возвращает `200` и `{ ok: true }`)
- даже при недоступной БД тренажёр не ломается (есть localStorage fallback)

Опционально (API smoke через curl, если есть валидный `taskId`):

```bash
curl -i -X POST http://localhost:3000/api/attempts \
  -H 'Content-Type: application/json' \
  -d '{
    "topicId":"math.proportion",
    "skillId":"math.proportion.find_unknown_term",
    "taskId":"math.proportion.find_unknown_term.000001",
    "isCorrect":true,
    "userAnswer":"2",
    "durationMs":1500
  }'
```

Ожидаемый результат:
- `200 OK`
- JSON `{ "ok": true }`

### 3. Progress (`/[locale]/progress` и `/api/progress`)

Действие (API):

```bash
curl -i "http://localhost:3000/api/progress?topicId=math.proportion"
```

Ожидаемый результат:
- не `500`
- JSON с `ok: true`
- есть `topicId`, `progress` (map по skillId)

Действие (UI):
- открыть `http://localhost:3000/ru/progress`

Ожидаемый результат:
- страница открывается
- нет падения UI
- при наличии попыток показывается прогресс; без попыток — корректное пустое состояние

### 4. Compare (`/api/compare`)

Действие:

```bash
curl -i "http://localhost:3000/api/compare?topicId=math.proportion"
```

Ожидаемый результат:
- не `500`
- JSON с `ok: true`
- есть `currentUser`, `platform`, `percentile`

Примечание:
- если попыток мало, часть значений (`percentile`, `avgAccuracy`, `medianTotal`) может быть `null` — это нормально
- UI на `/ru/progress` должен показывать дружелюбное сообщение (“нужно 10 попыток...”)

### 5. Teacher flow (`/[locale]/teacher/variants`)

Действие:
1. Открыть `http://localhost:3000/ru/teacher/variants`
2. Если роли нет:
   - в dev включить `ALLOW_DEV_BECOME_TEACHER=1`
   - нажать `Стать учителем (dev)`
3. Нажать `Сгенерировать` на любом шаблоне
4. Открыть созданный вариант

Ожидаемый результат:
- шаблоны загружаются (`/api/teacher/templates?topicId=math.proportion`)
- список вариантов загружается (`/api/teacher/variants`)
- после генерации появляется новый вариант в списке
- страница деталей `/{locale}/teacher/variants/{id}` открывается без ошибки

Быстрые API-проверки (роль teacher обязательна):

```bash
curl -i "http://localhost:3000/api/teacher/templates?topicId=math.proportion"
curl -i "http://localhost:3000/api/teacher/variants"
```

Ожидаемый результат:
- как teacher/admin: `200`
- как student: `403` + JSON `{ ok:false, code:"FORBIDDEN", ... }`

### 6. Print pages

После генерации варианта взять `variantId` и открыть:
- `http://localhost:3000/ru/teacher/variants/<VARIANT_ID>/print`
- `http://localhost:3000/ru/teacher/variants/<VARIANT_ID>/answers/print`

Ожидаемый результат:
- страницы открываются
- задачи/ответы отрисованы
- LaTeX (через KaTeX) виден на variant print page
- верстка пригодна для печати (без явных “разъездов”)

### 7. PDF endpoints

Проверить:

```bash
curl -i "http://localhost:3000/api/teacher/variants/<VARIANT_ID>/pdf?locale=ru"
curl -i "http://localhost:3000/api/teacher/variants/<VARIANT_ID>/answers-pdf?locale=ru"
```

Ожидаемое поведение (оба варианта считаются корректными для smoke):

Вариант A: PDF настроен
- `200 OK`
- `Content-Type: application/pdf`

Вариант B: PDF не настроен / Chromium недоступен
- `501`
- JSON с понятным сообщением (`error`) и fallback на print-to-PDF

Важно:
- `501` здесь — ожидаемый fallback MVP, а не обязательно “красная” ошибка деплоя
- если PDF должен работать в production, см. `OPS_PDF.md`

### 7.2 Work PDF engine policy (teacher-tools)

После генерации работы в `/{locale}/teacher-tools`:

1. Открыть страницу работы `/{locale}/teacher-tools/works/{WORK_ID}`
2. Проверить `Печать всех` / `PDF всех` при `1 вариант/стр` и `2 варианта/стр`

Ожидаемый результат:
- `layout=single`: обычно `chromium` (если не переопределено env/query)
- `layout=two`: может автоматически выбираться `latex` (если `LATEX_PDF_ENABLED=1`)

Как проверить:
- `Network` -> response headers:
  - `X-PDF-Engine`
  - `X-PDF-Engine-Source`

Проверка явного override:

```bash
curl -i "http://localhost:3000/api/teacher/demo/works/<WORK_ID>/pdf?locale=ru&layout=single&orientation=portrait&engine=latex"
```

Ожидаемый результат:
- `X-PDF-Engine: latex`
- либо `200 PDF`, либо диагностируемый `LATEX_*` JSON

### 7.1 Teacher-tools / Work print profile (work-based flow)

После генерации вариантов в `/{locale}/teacher-tools`:
1. Нажать `Открыть работу`
2. На странице работы проверить блок `Оформление` / `Рекомендация`

Ожидаемый результат:
- есть `Тип работы`
- есть `Оформление` (`1 вариант/стр` / `2 варианта/стр`)
- есть рекомендация с причинами

Проверка default profile:
1. На странице работы выбрать оформление (например `1 вариант/стр`)
2. Открыть `Печать всех` / `PDF всех` **без ручного дописывания query**

Ожидаемый результат:
- `/{locale}/teacher-tools/works/{id}/print` использует `Work.printProfileJson` как дефолт
- `/api/teacher/demo/works/{id}/pdf` даёт тот же layout (или `501` fallback при недоступном PDF)

Проверка блокировки `2/стр`:
- для “тяжёлой” работы (длинные условия / много задач) UI должен:
  - рекомендовать `1 вариант/стр`
  - отключать или явно предупреждать про `2 варианта/стр`

Проверка force override:
- нажать `Всё равно попробовать (force)` (если доступно)
- открыть `Печать всех` / `PDF всех`

Ожидаемый результат:
- в URL появляется `force=1`
- вывод всё равно генерируется (print/PDF/fallback), несмотря на запрет рекомендации

### 8. Локали (минимум)

Минимум:
- полноценно пройти smoke на `/ru`

Быстрый sanity-check для других локалей (по необходимости):
- `http://localhost:3000/en`
- `http://localhost:3000/de`
- `http://localhost:3000/en/progress`
- `http://localhost:3000/de/progress`

Ожидаемый результат:
- страницы открываются
- нет `500` / runtime crash

## D. Common Failure Signals (что смотреть)

### Prisma / DB

Симптомы:
- `relation "...\" does not exist`
- `Drift detected`
- `migrations diverged`
- `Prisma client ...`

Что делать:
- см. `LOCAL_DEV.md` (разделы Prisma / Troubleshooting)
- проверить:
  - `DATABASE_URL`
  - `docker compose ps`
  - `pnpm prisma migrate status`
  - `pnpm prisma generate`

### PDF / Puppeteer / Chromium

Симптомы:
- `501` с `puppeteer is not installed`
- `Could not find Chrome`
- `error while loading shared libraries`

Что делать:
- см. `OPS_PDF.md`
- проверить:
  - `BASE_URL`
  - `PUPPETEER_EXECUTABLE_PATH`
  - наличие Chromium/Chrome
- системные Linux-библиотеки

### LaTeX beta (teacher work PDF)

Симптомы:
- `LATEX_UNAVAILABLE`
- `LATEX_COMPILE_ERROR`
- `LATEX_UNSUPPORTED_PROFILE`

Что смотреть:
- `OPS_PDF.md` (LaTeX beta env + troubleshooting)
- `details` в JSON (в dev)
- заголовки `X-PDF-Engine`, `X-PDF-Engine-Source`

Полезная проверка:

```bash
pnpm validate:tasks -- --latex-warn
```

### Teacher API auth / role

Симптомы:
- `403` + `FORBIDDEN` на `/api/teacher/*`

Что значит:
- у пользователя нет `teacher/admin` роли (это нормальное поведение)

Что делать (dev):
- включить `ALLOW_DEV_BECOME_TEACHER=1`
- получить роль через UI/`POST /api/teacher/become`

---

## Быстрый итог smoke (короткая отметка)

Перед/после деплоя достаточно отметить:
- [ ] DB и Prisma ок
- [ ] Attempts пишутся (или UI не падает с fallback)
- [ ] `/ru/progress` работает
- [ ] `/api/compare?topicId=math.proportion` отвечает
- [ ] Teacher variants генерируются
- [ ] Print pages открываются
- [ ] PDF endpoint даёт `200 pdf` **или** корректный `501 fallback`
