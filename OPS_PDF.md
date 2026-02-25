# PDF Export Operations (Teacher Variants)

Инструкция для настройки и диагностики PDF export в MathSite (Teacher variants).

Подходит для:
- локальной настройки (WSL/Linux)
- staging/prod
- self-hosted deployment

После выкладки/изменений PDF или teacher flow прогоните короткий smoke-check:
- `SMOKE_CHECKLIST.md`

## A. Overview

### Что делает PDF export

Teacher UI вызывает API endpoints:
- `/api/teacher/variants/{id}/pdf?locale=ru`
- `/api/teacher/variants/{id}/answers-pdf?locale=ru`

API:
1. проверяет доступ учителя и наличие варианта
2. открывает соответствующую print-страницу (`/print` или `/answers/print`)
3. рендерит PDF через `puppeteer`
4. возвращает PDF (`200`, `application/pdf`)

### Режимы работы (важно)

Есть два нормальных режима:

1. `PDF OK`
- API возвращает `200`
- `Content-Type: application/pdf`

2. `501 fallback`
- API возвращает `501` + JSON
- в `error` даётся причина (нет puppeteer / Chrome / системных библиотек / ошибка запуска)
- рекомендуется использовать print-страницы и browser Print-to-PDF

Это штатное поведение MVP, а не падение сервиса.

## B. Required Env

Реально используемые переменные (по коду `src/lib/variants/pdf.ts`):

### `BASE_URL` (опционально, но рекомендуется в production)

Используется для построения абсолютного URL print-страницы при server-side рендере PDF.

Поведение:
- если `BASE_URL` задан -> используется он
- если не задан -> берётся `new URL(request.url).origin`

Примеры:

```bash
BASE_URL=https://mathsite.example.com
```

Для локальной разработки обычно можно не задавать.

### `PUPPETEER_EXECUTABLE_PATH` (опционально)

Используется в `puppeteer.launch({ executablePath })`.

Нужен, если:
- вы используете системный Chromium/Chrome
- или bundled Chrome puppeteer не подходит/не запускается

Примеры:

```bash
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

```bash
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
```

### Другие env для PDF

В текущей реализации **других env нет**.

## C. Chromium Setup Options

Есть два практических варианта.

### Вариант 1: Puppeteer bundled Chrome (через cache puppeteer)

Подходит для:
- локальной разработки
- окружений, где можно скачивать browser бинарник

Шаги:

```bash
pnpm install
pnpm approve-builds
pnpm exec puppeteer browsers install chrome
```

Плюсы:
- минимальная настройка в коде
- не нужно искать путь к системному Chromium

Минусы:
- скачивание может быть долгим
- cache браузера хранится отдельно (обычно `~/.cache/puppeteer`)
- в Linux/WSL всё равно нужны системные библиотеки

### Вариант 2: System Chromium / Chrome

Подходит для:
- production / VPS
- WSL/Linux с управляемым набором пакетов

Шаги:

1. Установить Chromium/Chrome в систему
2. Узнать путь:

```bash
which chromium
# или
which chromium-browser
# или
which google-chrome
```

3. Задать env:

```bash
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

4. Перезапустить приложение

Плюсы:
- воспроизводимее в проде
- проще контролировать версию/пакеты через ОС

Минусы:
- нужно отдельно ставить пакет браузера и его зависимости
- путь зависит от дистрибутива

## D. System Dependencies (Ubuntu / WSL)

Для headless Chromium в Linux обычно нужен набор системных библиотек.

Ниже типовой набор (Ubuntu/WSL, может отличаться по дистрибутиву/версии).

### Ubuntu 24.04+ (t64 packages)

```bash
sudo apt update
sudo apt install -y \
  libasound2t64 \
  libatk-bridge2.0-0t64 \
  libatk1.0-0t64 \
  libc6 \
  libcairo2 \
  libcups2t64 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc-s1 \
  libglib2.0-0t64 \
  libgtk-3-0t64 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  ca-certificates \
  fonts-liberation \
  xdg-utils
```

### Ubuntu 22.04 и ниже (часто без `t64`)

Названия пакетов могут быть без суффикса `t64`, например:
- `libasound2`
- `libgtk-3-0`
- `libcups2`

Если `apt` пишет “virtual package” или “no installation candidate”, проверь аналогичный пакет с `t64`.

## E. Production Checklist

Минимальный чеклист после деплоя/обновления:

### 1) Проверить env

- `BASE_URL` указывает на публичный домен сервиса
- `PUPPETEER_EXECUTABLE_PATH` задан (если используете system Chromium)

Пример:

```bash
BASE_URL=https://math.example.com
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

### 2) Проверить, что teacher flow работает

1. Открыть `/{locale}/teacher/variants`
2. Сгенерировать вариант
3. Открыть detail
4. Нажать `PDF`

### 3) Проверить API endpoint напрямую

```bash
curl -i "https://your-domain.example/api/teacher/variants/<ID>/pdf?locale=ru"
```

Ожидаемо:
- `200 OK` и `Content-Type: application/pdf`

Если `501`:
- см. `Troubleshooting` ниже (это диагностируемый fallback, не silent failure)
- ответ теперь структурированный (`code = "PDF_UNAVAILABLE"`, `hints`, `docs`)

### 4) Проверить print fallback

Если PDF не настроен, убедиться что печатные страницы доступны:
- `/{locale}/teacher/variants/{id}/print`
- `/{locale}/teacher/variants/{id}/answers/print`

## F. Troubleshooting

### 1) `501` + `puppeteer is not installed`

Симптом (из API):
- `PDF export unavailable: puppeteer is not installed...`

Что значит:
- пакет `puppeteer` отсутствует в runtime-окружении

Что делать:

```bash
pnpm install
```

Если `pnpm` блокирует postinstall:

```bash
pnpm approve-builds
pnpm exec puppeteer browsers install chrome
```

### 2) `Could not find Chrome` / browser не найден

Симптом:
- `Could not find Chrome (ver. ...)`

Что значит:
- `puppeteer` установлен, но browser бинарник не скачан
- или задан неверный `PUPPETEER_EXECUTABLE_PATH`

Что делать (bundled browser):

```bash
pnpm exec puppeteer browsers install chrome
```

Что делать (system browser):
- проверить путь:

```bash
which chromium
which chromium-browser
which google-chrome
```

- задать корректный `PUPPETEER_EXECUTABLE_PATH`

### 3) `error while loading shared libraries` / browser launch failed

Симптом:
- `Failed to launch the browser process`
- `error while loading shared libraries: ...`

Что значит:
- не хватает системных Linux-библиотек для Chromium

Что делать:
- установить типовой набор зависимостей (см. раздел `D`)
- затем перезапустить приложение

### 4) `BASE_URL` неверный / print page недоступна из сервера

Симптомы:
- `page.goto(...)` timeout / connection errors
- PDF endpoint возвращает `501` с ошибкой запуска/навигации

Что проверить:
- `BASE_URL` указывает на реальный адрес, доступный **с самого сервера**
- домен/порт/протокол корректны
- приложение действительно отвечает по этому адресу

Быстрая проверка на сервере:

```bash
curl -I "$BASE_URL/ru"
```

### 5) `501 fallback` — что это значит

`501` в PDF endpoint в текущей реализации означает:
- PDF-движок недоступен или сломан
- но приложение работает, и есть fallback на print-страницы

Типовой JSON-ответ:

```json
{
  "ok": false,
  "code": "PDF_UNAVAILABLE",
  "message": "PDF export is not available in this environment. Use print-to-PDF via /print pages. See OPS_PDF.md.",
  "hints": [
    "Use browser Print to PDF via /print pages.",
    "Set BASE_URL to the public URL of the app.",
    "Install Chromium and required system libraries on the server.",
    "Set PUPPETEER_EXECUTABLE_PATH if using system Chromium.",
    "See OPS_PDF.md."
  ],
  "docs": "OPS_PDF.md"
}
```

В `development` может дополнительно прийти `details` (без секретов) для быстрой диагностики.

Что делать:
1. Прочитать `code/message/hints` в JSON-ответе API
2. Исправить причину (puppeteer/browser/libs/env)
3. Пока не исправлено — использовать `/print` и browser Print-to-PDF

### 6) Где смотреть логи и что искать

PDF helper пишет server-side лог при `501` (без секретов). Основные источники:
- логи Next.js / process stdout-stderr
- JSON-ответ PDF endpoint (`501`)

Ищите запись вида:
- `event: "pdf_unavailable"`
- `code`: `PUPPETEER_NOT_INSTALLED` / `CHROME_NOT_FOUND` / `LAUNCH_FAILED` / `NAVIGATION_FAILED`
- `flags.hasBaseUrl`
- `flags.hasExecutablePath`

В `production` лог намеренно без stack trace/секретов.
В `development` лог может включать исходную ошибку (stack trace) для диагностики.

## Быстрая памятка (оператору)

Если PDF не работает:

1. Открой endpoint PDF и посмотри JSON `error`
2. Если `501`, это ожидаемый fallback — print-страницы должны работать
3. Проверь:
   - `puppeteer` установлен
   - Chrome/Chromium доступен
   - Linux libs установлены
   - `BASE_URL` корректен
4. Повтори проверку endpoint
