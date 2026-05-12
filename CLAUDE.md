# CLAUDE.md — Tower v2

Мастер-инструкция для AI-агентов, работающих в этом репозитории. Подробный план — [PLAN.md](PLAN.md).

## TL;DR

- Stack: **Vite + React 19 + TS strict + Tailwind 4 + RTK Query + React Router 7**.
- Архитектура: **модульная по доменам** (`src/modules/<name>`), границы импортов энфорсятся ESLint (`eslint-plugin-boundaries`).
- RBAC: permission keys + `<Can/>` / `usePermission`. Никаких прямых проверок ролей в UI.
- Server state — только RTK Query, не дублируется в Redux.
- Формы — `react-hook-form` + `zod`.
- UI: shadcn/ui + Tailwind tokens (`bg-card`, `text-foreground`). Никаких inline-стилей и хардкод hex.
- **Дизайн берём из проекта `Desktop/artkai/tower`** (https://tower-artkai.netlify.app), но **код пишем по правилам этой апки**. См. PLAN.md → "Источник дизайна".

## Workflow

1. Перед любой задачей — прочитать `.memory/MEMORY.md` и `.memory/task_routing.md`.
2. Внутри модуля — сначала `modules/<name>/CLAUDE.md`.
3. После изменений — `yarn check` (lint + typecheck + test). Не зелёный = не готово.
4. Любая правка, затронувшая Public API / Routes / Permissions, обязана обновить `CLAUDE.md` модуля.
5. CHANGELOG.md — append-only, запись на каждый PR.

## Импорт-границы (жёстко)

```
app → widgets → modules → shared
```

- Модули **не зависят друг от друга по UI/runtime** — только типы через barrel.
- Импорт во внутренности модуля запрещён: только `@/modules/<name>` (barrel).
- Алиасы `@/...`, никаких `../../../`.

## Code style (краткое)

- Named exports (default — только для pages под `React.lazy`).
- Файл ≤ 300 строк (warn), 400 (error). Функция ≤ 80 строк.
- Никаких однобуквенных переменных в колбэках: `employees.map((employee) => …)`.
- Комментарии — только про **ПОЧЕМУ**, никогда про **ЧТО**.
- Никаких `any`. `noUncheckedIndexedAccess: true`.

Полные правила — в `PLAN.md` секция "Code Style и правила".

## Команды

```
yarn dev          # vite dev server
yarn build        # tsc -b && vite build
yarn lint         # eslint
yarn typecheck    # tsc -b --noEmit
yarn test         # vitest run
yarn check        # lint + typecheck + test
```

## Структура

См. [ARCHITECTURE.md](ARCHITECTURE.md).

## Чеклист перед PR

`.memory/invariants_checklist.md`.
