# Architecture — Tower v2

Полная мотивация и обоснование — в [PLAN.md](PLAN.md). Здесь — операционная карта.

## Слои

```
src/
├── app/                # Композиция: providers, store, router, App
├── widgets/            # Кросс-модульные UI: AppLayout, Header, Sidebar
├── modules/            # Бизнес-домены (чёрные ящики через barrel)
│   └── <name>/
│       ├── api/        # RTK Query endpoints
│       ├── model/      # types, zod-схемы, селекторы
│       ├── components/ # доменные компоненты
│       ├── hooks/
│       ├── pages/      # default export для React.lazy
│       ├── permissions.ts
│       └── index.ts    # ПУБЛИЧНЫЙ API
├── shared/             # Переиспользуемое, не знает о доменах
│   ├── ui/             # shadcn + обёртки
│   ├── lib/            # cn(), хуки, rbac/
│   ├── api/            # baseApi, authProvider
│   ├── config/         # routes, permissions, env
│   └── types/
├── mocks/              # MSW handlers + fixtures (фаза 1+)
└── test/               # vitest setup
```

## Граф зависимостей

```
app → widgets → modules → shared
        ↑          ↑
        └──────────┘  (widgets читают только типы и permission keys модулей, не UI)
```

- `shared` не знает о модулях.
- `modules` не знают о `widgets` и `app`.
- Модули **не импортят друг друга по UI/runtime**, только через типы из barrel.

Энфорсится `eslint-plugin-boundaries` в `eslint.config.js`.

## Data flow

- **Server state** — RTK Query (`baseApi.injectEndpoints` в каждом модуле).
- **Глобальный UI state** — Redux slice (`app/uiSlice.ts`: theme, sidebar).
- **Auth** — отдельный модуль + `authProvider` абстракция (заглушка → SSO).
- **Локальный UI state** — `useState`/`useReducer` в компоненте.

Бизнес-данные **никогда** не дублируются в Redux.

## Routing

`src/app/router.tsx` — карта роутов. Layout-route рендерит `AppLayout` (Header + Sidebar + `<Outlet/>`). Защищённые роуты оборачиваются в `<RequirePermission>` (добавляется вместе с RBAC ядром в шаге 4 плана).

## RBAC (см. PLAN.md → "RBAC")

- Permission keys — namespaced строки (`employees.viewSalary`).
- `Record<Role, Permission[]>` — `shared/config/permissions.ts` + расширения из модулей.
- UI: `<Can permission="…">`, `usePermission("…")`, `<RequirePermission permission="…">` на роутах.

## Темы

CSS-variables в `src/index.css`, переключение классом `.dark` на `<html>` через `ThemeProvider`. Цвета — только через `var(--color-*)` или Tailwind-токены, никаких хардкод hex.
