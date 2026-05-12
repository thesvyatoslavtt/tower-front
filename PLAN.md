# Tower v2 — План разработки

## Context

Внутри Artkai есть прототип `Desktop/artkai/tower` (live: https://tower-artkai.netlify.app) — enterprise-портал для сотрудников: people directory, finance, projects, recruiting, admin и т.д. Проект полностью написан AI без архитектурного контроля: PersonPage = 4421 строка, дублирующиеся permission-системы (RoleContext + config/permissions.ts), 17 ролей, моки разбросаны по 50+ файлам, prop drilling, inline-стили вперемешку с Tailwind.

Задача — переписать его «с нуля, грамотно» с помощью AI-агентов из соседнего проекта-фабрики. На старте делаем три экрана: **Header, Sidebar (с меню), People Directory** + переход с Active Employees на **Employee Detail**. Дальше расширяемся итеративно. Архитектура и `.md`-контекст должны быть рассчитаны на то, что код пишут агенты — значит, должны быть чёткие инварианты, рецепты добавления фич, single source of truth для типов/ролей/permission-ключей.

## Стек

| Слой | Выбор | Обоснование |
|---|---|---|
| Build | **Vite 5 + React 19 + TS strict** | Скорость, совместимость со стеком фабрики. |
| Routing | **React Router 7 (data routers)** | Loader/action API, удобные guard'ы. |
| State / API | **Redux Toolkit + RTK Query** | Запрос пользователя; tag-based invalidation, кэш, code splitting. |
| Mock API | **MSW (Mock Service Worker)** | Пишем endpoints как в проде, моки на dev/test. Backend подключим заменой baseUrl. |
| UI | **shadcn/ui + Tailwind 4 + Radix + lucide-react** | Совместимость с tower, легко переиспользовать визуал. |
| Forms | **react-hook-form + zod** | Типизированные схемы, общая валидация с RTK Query DTO. |
| Тесты | **Vitest + Testing Library + Playwright (e2e)** | Стандарт. |
| Lint/Format | **ESLint 9 + Prettier + lint-staged + Husky** | Жёсткие правила, агенты гоняют `npm run check`. |
| Auth | **Абстракция `authProvider`** (заглушка → Google SSO / Supabase позже) | Решение отложено; интерфейс зафиксирован. |
| Permissions | **RBAC через permission keys + `<Can/>` + `usePermission`** | Гибко, тестируемо, явно. |
| Deploy | **Netlify** (как tower) | preview branches, SPA redirects. |

## Архитектура — модульная по доменам

Выбрана **модульная архитектура** (а не FSD). Каждый бизнес-домен = самодостаточный модуль с публичным API через barrel. Это даёт жёсткие границы (как FSD), но меньше слоёв и проще для AI-агентов: один таск = одна папка.

```
src/
├── app/                       # Композиция приложения
│   ├── providers/             # StoreProvider, RouterProvider, ThemeProvider, AuthProvider, ErrorBoundary
│   ├── router.tsx             # карта роутов + guard'ы
│   ├── store.ts               # configureStore
│   └── App.tsx
│
├── shared/                    # Переиспользуемое, без знания о доменах
│   ├── ui/                    # shadcn-компоненты + обёртки (Button, Dialog, Table, FormField)
│   ├── lib/                   # cn(), хуки общего назначения
│   │   └── rbac/              # Can, usePermission, RequirePermission
│   ├── api/                   # baseApi, baseQueryWithReauth, authProvider (абстракция)
│   ├── config/                # env, ROUTES, permission keys, базовая Role→Permission[] матрица
│   └── types/                 # глобальные типы (UserId, Role, Permission, ApiError)
│
├── modules/                   # ★ БИЗНЕС-ДОМЕНЫ. Каждый модуль — чёрный ящик.
│   ├── auth/
│   │   ├── api/
│   │   ├── model/             # types.ts, schemas (zod), slice (если нужен)
│   │   ├── components/
│   │   ├── hooks/             # useCurrentUser, useLogin
│   │   ├── pages/             # LoginPage
│   │   └── index.ts           # ПУБЛИЧНЫЙ API модуля
│   │
│   ├── people/
│   │   ├── api/               # peopleApi.ts (RTK Query endpoints)
│   │   ├── model/             # Employee type, zod-схемы, селекторы
│   │   ├── components/        # EmployeeCard, EmployeeFilters, EmployeeStatusBadge
│   │   ├── hooks/             # useEmployeeFilters, useEmployeeActions
│   │   ├── pages/
│   │   │   ├── PeopleDirectoryPage/
│   │   │   └── EmployeeDetailPage/
│   │   │       ├── EmployeeDetailPage.tsx
│   │   │       └── tabs/      # OverviewTab, SalaryTab (lazy)
│   │   ├── permissions.ts     # какие permission-ключи объявляет модуль
│   │   └── index.ts
│   │
│   ├── finance/               # (будущее)
│   ├── projects/              # (будущее)
│   ├── recruiting/            # (будущее)
│   └── admin/                 # (будущее)
│
├── widgets/                   # Кросс-модульные UI-композиции
│   ├── AppLayout/             # Shell: Header + Sidebar + <Outlet/>
│   ├── Header/
│   └── Sidebar/               # читает menuItems (фильтрует по permissions)
│
└── mocks/                     # MSW
    ├── browser.ts
    ├── handlers/
    │   ├── people.ts
    │   └── auth.ts
    └── fixtures/
        ├── employees.ts
        └── users.ts
```

### Правила модульности (жёстко энфорсятся ESLint `eslint-plugin-boundaries`)

1. **Модуль = чёрный ящик.** Снаружи можно импортить **только из `modules/<name>/index.ts`** (barrel). Прямые импорты во внутренности (`modules/people/api/...`) запрещены.
2. **Модули не зависят друг от друга напрямую.** Если нужны данные другого домена — только через:
   - публичные **типы** из barrel (`import type { Employee } from "@/modules/people"`),
   - или RTK Query теги/cache.
   - **Никаких** UI-компонентов одного модуля в другом.
3. **Граф зависимостей однонаправлен:**
   ```
   app  →  widgets  →  modules  →  shared
                       (parallel, no cross-imports)
   ```
   - `shared` не знает о модулях.
   - `modules` не знают о `widgets` и `app`.
   - `widgets` могут читать типы и permission-ключи модулей, но не их UI.
4. **Pages живут внутри модулей** (`modules/people/pages/...`), а не в глобальной `src/pages/`. `app/router.tsx` lazy-импортит их через публичный barrel.
5. **Permissions.** Базовая `Role → Permission[]` матрица — в `shared/config/permissions.ts`. Каждый модуль может **расширять** её через свой `modules/<name>/permissions.ts`, который мерджится в единый словарь при инициализации `AuthProvider`. Это позволяет добавлять модуль без правки центрального файла.
6. **Widgets — тонкие композиции.** `Sidebar` знает только `menuItems` (массив `{ label, path, permission, icon }`) и фильтрует по permissions. Никакой бизнес-логики.
7. **Pages — тонкие.** Page собирает компоненты модуля и widgets; вся логика — в хуках модуля.

### Почему модульная, а не FSD

- В FSD `entities/features/widgets` — агенты часто путают, к какому слою отнести «фильтры на странице сотрудников». В модульной — это просто `modules/people/components/EmployeeFilters.tsx`.
- Меньше папок и barrel'ов → меньше шанса наследить.
- Один скилл `add-module-feature` работает на любой домен.
- Рецепты в `CONTRIBUTING.md` короче и конкретнее.

## RBAC: роли и пермишены

### Модель

```ts
// shared/types/rbac.ts
export type Role =
  | "super_admin" | "exec" | "hr" | "recruiter"
  | "finance" | "pm" | "delivery_lead" | "employee";

export type Permission =
  | "employees.view"      | "employees.viewAll"
  | "employees.edit"      | "employees.viewSalary"
  | "employees.editSalary"| "employees.viewSensitive"
  | "projects.view"       | "projects.edit"
  | "finance.view"        | "admin.access"
  // ...
```

- `shared/config/rolePermissions.ts` — словарь `Record<Role, Permission[]>`. **Единый источник правды.**
- API возвращает `{ user, roles: Role[] }`. Permissions вычисляются на клиенте из ролей (и кешируются в Redux).
- Никаких отдельных boolean-флагов в UI — только `permission keys`.

### Использование

```tsx
// hook
const canEditSalary = usePermission("employees.editSalary");

// component-guard (render-prop)
<Can permission="employees.editSalary" fallback={null}>
  <SalaryEditor />
</Can>

// route-guard
<Route element={<RequirePermission permission="admin.access" />}>
  <Route path="/admin/*" element={<AdminLayout />} />
</Route>

// menu items
const items = useFilteredMenu(MENU_ITEMS); // отфильтрует по permission
```

### Авторизация (заглушка → SSO)

`shared/api/authProvider.ts`:
```ts
export interface AuthProvider {
  login(): Promise<Session>;
  logout(): Promise<void>;
  getSession(): Promise<Session | null>;
  refresh(): Promise<Session>;
}
```
На старте — `mockAuthProvider` (localStorage + переключатель ролей для удобства разработки и демо). Реализация Google SSO добавляется без изменений в UI.

`baseQueryWithReauth` — стандартный паттерн RTK Query: 401 → `refresh()` → retry.

## Источник дизайна: проект `tower`

**Визуал берём из существующего `Desktop/artkai/tower`** (live: https://tower-artkai.netlify.app) — переиспользуем готовые композиции, верстку экранов, цвета, типографику, иконки, отступы, состояния (hover/active/empty/loading), формы карточек/таблиц/модалок. Это экономит дизайнерскую работу и сохраняет визуальную преемственность.

**Но код переписываем с нуля по правилам новой апки** — никакого копипаста файлов. То есть:

- **Что копируем:** внешний вид и UX-поведение. Открываем экран в tower, смотрим как он выглядит/работает, и воспроизводим в новой архитектуре.
- **Что НЕ копируем:**
  - структуру файлов/папок tower (там FSD-каша и mock-контексты);
  - inline-стили, локальные хардкод-цвета — только токены темы (`bg-card`, `text-foreground`);
  - однофайловые мега-компоненты (PersonPage 4421 строк) — разбиваем по правилам размера (≤300 строк);
  - дублирующиеся permission-системы — только наш RBAC (`<Can/>` / `usePermission`);
  - моки в Redux/Context — только MSW;
  - кастомные обёртки поверх Radix — берём shadcn/ui as-is + наши обёртки в `shared/ui`.
- **Правила новой апки имеют приоритет** при любом конфликте: модульные границы, named exports, RBAC через permission keys, RTK Query для server state, react-hook-form + zod для форм, naming-convention, размер файлов, импорт-порядок, отсутствие комментариев-что.
- **Иконки:** `lucide-react` (как в tower) — маппинг 1:1 где возможно.
- **Tailwind токены** переносим как theme tokens в `tailwind.config` + CSS-variables (light/dark), а не как хардкод.
- **shadcn-компоненты** ставим заново через CLI (`npx shadcn@latest add ...`), не копируем из tower — версии и API могли разойтись.

**Скилл `add-page` / `add-component` обязан в pre-flight зафиксировать reference на экран tower** (URL + скриншот/описание) и сослаться на него в PR-описании, чтобы ревьюер мог сверить визуал.

## Скоуп MVP (фаза 1)

| # | Артефакт | Файлы |
|---|---|---|
| 1 | Скелет проекта + конфиги | `vite.config.ts`, `tsconfig`, `eslint`, `tailwind`, `index.css` |
| 2 | Провайдеры + роутер + store | `app/providers/*`, `app/router.tsx`, `app/store.ts` |
| 3 | `baseApi` (RTK Query) + MSW bootstrap | `shared/api/baseApi.ts`, `mocks/browser.ts`, `mocks/handlers/*` |
| 4 | RBAC: типы, словарь, `<Can/>`, `usePermission`, `RequirePermission` | `shared/types/rbac.ts`, `shared/config/permissions.ts`, `shared/lib/rbac/*` |
| 5 | Auth абстракция + `mockAuthProvider` + auth module | `shared/api/authProvider.ts`, `modules/auth/*` |
| 6 | **Widget: Header** | поиск (Cmd+K заглушка), нотификации (заглушка), role-switcher (dev only), theme toggle, user menu |
| 7 | **Widget: Sidebar** | logo, меню (фильтрация по permission), активный пункт, mobile-overlay, user-card |
| 8 | **Page: PeopleDirectory** (`modules/people/pages/PeopleDirectoryPage`) | KPI cards, фильтры (search/unit/type), таблица Active Employees, секция Former (collapsible), row click → `/people/:id` |
| 9 | **Page: EmployeeDetail** (MVP, `modules/people/pages/EmployeeDetailPage`) | Только tab Overview: имя, контакты, unit, position, статус, manager. Остальные табы — заглушки с TODO |
| 10 | MSW фикстуры | 18 сотрудников (как в tower U01–U18), несколько ролей |
| 11 | Netlify deploy + `_redirects` для SPA | `public/_redirects` |

Out of scope для фазы 1: Finance, Projects, Sales, Recruiting, Admin, Performance, 360, Offboarding, Equipment, Documents — но архитектура и RBAC должны позволить добавлять их «через рецепт» (см. CONTRIBUTING.md).

## Документация для AI-агентов (`.md` контекст)

Black Memory переезжает **внутрь репо** — `.memory/` коммитится в git.

```
tower-v2/
├── README.md                     # human-facing
├── CLAUDE.md                     # мастер-инструкция для агентов: инварианты, workflow, ссылки
├── ARCHITECTURE.md               # слои, импорт-правила, провайдеры, data flow
├── CONTRIBUTING.md               # рецепты: "Как добавить page / feature / RTK endpoint / permission / роль"
├── CHANGELOG.md                  # append-only
├── docs/
│   ├── rbac.md                   # роли, permissions, как добавлять
│   ├── auth.md                   # текущая заглушка + план SSO
│   ├── api-conventions.md        # naming endpoints, DTO, error shape
│   ├── ui-guidelines.md          # shadcn-паттерны, темы, accessibility
│   └── testing.md                # unit/e2e подходы
├── .memory/                      # Black Memory (in-repo)
│   ├── MEMORY.md                 # индекс (что где лежит)
│   ├── project_core.md           # стек, команды, пути, ключевые компоненты
│   ├── task_routing.md           # task type → какие .md читать
│   ├── invariants_checklist.md   # чеклист перед PR (импорт-правила, RBAC, типы)
│   ├── glossary.md               # термины: Unit, Type, Probation, Allocation...
│   └── feedback/                 # накопление feedback-памяти от ревью
└── .claude/
    ├── settings.json             # permissions allowlist + hooks
    ├── hooks/send-usage.sh       # как в других проектах (analytics)
    └── skills/                   # см. раздел "Скиллы для агентов" ниже
        ├── add-module/
        ├── add-page/
        ├── add-rtk-endpoint/
        ├── add-permission/
        ├── add-component/
        ├── add-widget/
        ├── add-form/
        ├── add-table/
        ├── add-msw-handler/
        ├── add-test/
        └── split-large-file/
```

## Скиллы для агентов (`.claude/skills/`)

Скиллы — это «рецепты», по которым агенты-фабрики выполняют типовые задачи. Каждый скилл = папка с `SKILL.md` (триггеры, шаги, чеклисты) и опционально `templates/` (boilerplate).

**Структура `.claude/skills/<name>/SKILL.md`** (обязательные секции):
1. **Trigger** — фразы пользователя, при которых скилл активируется.
2. **Inputs** — какие параметры нужны.
3. **Pre-flight checklist** — что проверить ДО действий.
4. **Steps** — пошаговый рецепт с путями к файлам и шаблонам.
5. **Post-flight checklist** — что должно быть на выходе (lint/typecheck/CLAUDE.md модуля обновлён и т.д.).

### Скиллы MVP (создаём сразу, Tier 1 + Tier 2)

| Скилл | Триггер | Что делает |
|---|---|---|
| **`add-module`** | «создай модуль X» | Скаффолдит `modules/<name>/{api,model,components,hooks,pages}/`, `index.ts`, `permissions.ts`, `CLAUDE.md` модуля по шаблону (≤200 строк). Регистрирует модуль в `app/store.ts` и `app/router.tsx`. |
| **`add-page`** | «добавь страницу X в модуль Y» | Создаёт `modules/<Y>/pages/<X>/`, `<X>.tsx` (default export для `React.lazy`), регистрирует роут с `<RequirePermission>`, обновляет секцию Routes в `CLAUDE.md` модуля. |
| **`add-rtk-endpoint`** | «добавь endpoint X к модулю Y» | Расширяет `modules/<Y>/api/<y>Api.ts` через `injectEndpoints`. Добавляет DTO + zod-схему в `model/types.ts`. Корректно проставляет `providesTags`/`invalidatesTags`. Параллельно добавляет MSW handler в `mocks/handlers/<y>.ts` и фикстуру. |
| **`add-permission`** | «добавь permission X» / «дай роли Y доступ к Z» | Добавляет ключ в `modules/<m>/permissions.ts` (или `shared/config/permissions.ts` для глобальных), обновляет матрицу `Role → Permission[]`, `docs/rbac.md`, `CLAUDE.md` модуля, добавляет тест на `usePermission`. |
| **`add-component`** | «добавь компонент X» | Создаёт `<X>.tsx` (named export) + `index.ts` в правильной папке (`shared/ui` vs `modules/<m>/components` vs `widgets`), по строгому шаблону структуры компонента из CLAUDE.md. Прогоняет правило размера файла. |
| **`add-widget`** | «добавь widget X» | Создаёт `widgets/<X>/`, проверяет что widget не тянет UI из модулей (только типы и permission keys), добавляет в `widgets/index.ts`. |
| **`add-form`** | «добавь форму X» | Скаффолдит форму на `react-hook-form` + `zod` resolver, использует обёртки `shared/ui/form/*`, DTO рядом, тип через `z.infer`. Обрабатывает loading/error состояния через RTK Query mutation. |
| **`add-table`** | «добавь таблицу X» | Шаблон на shadcn Table + сортировка/фильтр/пагинация, интеграция с RTK Query query, skeleton-состояние, empty-state, RBAC-фильтрация колонок через `<Can/>`. |
| **`add-msw-handler`** | «замокай endpoint X» | Создаёт handler + фикстуру в `mocks/`, гарантирует совпадение типов с DTO модуля, регистрирует в `mocks/handlers/index.ts`. |
| **`add-test`** | «напиши тест к X» | Подбирает тип теста (Vitest для хуков/утилит, RTL для компонентов, Playwright для e2e), создаёт `*.test.tsx` рядом, использует тестовые provider'ы (Store/Router/Auth). |
| **`split-large-file`** | «разбей файл X» / автоматически при `max-lines` warning | Анализирует файл, выделяет подкомпоненты / хуки / конфиги в соседние файлы по правилам из CLAUDE.md. |

### Скиллы Tier 3 (добавляем позже)

`update-memory`, `pre-pr-check`, `review-pr`, `add-role` — операционные/housekeeping. Создаём, когда появится живой PR-флоу и более одной роли в SSO.

### Принципы наших скиллов

- **Один скилл = одна операция.** Никаких «универсальных» скиллов на всё.
- **Каждый скилл обязательно обновляет `CLAUDE.md` модуля и `MEMORY.md`**, если затрагивает что-то, отражённое в них (Public API, Routes, Permissions, Data flow).
- **Post-flight всегда включает `npm run check`** (lint + typecheck + test). Скилл не считается выполненным, пока чек не зелёный.
- **Шаблоны (`templates/`) хранят boilerplate отдельно от инструкций** — это даёт детерминированный результат у разных агентов.

### Методология создания скиллов (по [agentskills.io](https://agentskills.io/skill-creation/best-practices))

Скиллы пишем **не наперёд**, а **по горячим следам реальной работы** — это рекомендация Anthropic «Extract from a hands-on task».

**Процесс:**
1. **Bootstrap идёт без скиллов.** Сначала ставим Vite, конфиги, .md-каркас, RBAC ядро.
2. При первом реальном применении паттерна (например, «создать модуль people») — пишем первую версию скилла по горячим следам.
3. Применяем скилл к следующей задаче того же типа → собираем gotchas → итерация v2.
4. После 3–5 применений скилл стабилизируется.

**Структура каждого `.claude/skills/<name>/SKILL.md`:**

```markdown
---
name: <skill-name>
description: <одно предложение для авто-триггера. Должно содержать ключевые фразы пользователя.>
---

## Trigger
Фразы, при которых скилл активируется.

## Inputs
Какие параметры нужны (имя модуля, имя сущности, permission keys).

## Pre-flight checklist
- [ ] Модуль/файл не существует
- [ ] Имя в корректном кейсе
- [ ] Зависимости установлены

## Steps
1. Создать `…` по шаблону `templates/…`
2. Зарегистрировать в `…`
3. Обновить `…`

## Gotchas        ← обязательная секция
Конкретные «грабли» нашего проекта, которые агент сделает неправильно
без явного указания. Пополняется после каждого реального применения.
Пример:
- При добавлении endpoint всегда обновляй `mocks/handlers/index.ts`,
  иначе MSW не подхватит handler.
- `providesTags` для list-эндпоинта должен включать `{ type: "X", id: "LIST" }`,
  иначе POST-мутация не инвалидирует список.

## Templates / Scripts
Ссылки на `templates/*.tsx`, `scripts/*.sh` в папке скилла.

## Validation loop
Что запустить и что делать, если упало:
1. `npm run check`
2. Если ESLint падает на boundaries — проверь импорты, не должны идти в обход barrel
3. Если typecheck — проверь, что DTO в `model/types.ts` и в MSW handler совпадают

## Post-flight checklist
- [ ] `npm run check` зелёный
- [ ] `CLAUDE.md` модуля обновлён (если затронут Public API/Routes/Permissions)
- [ ] `MEMORY.md` индекс обновлён, если добавлен новый файл
- [ ] CHANGELOG.md обновлён
```

**Ключевые правила из agentskills.io, которые мы соблюдаем:**

- **SKILL.md ≤ 500 строк / 5000 токенов.** У нас цель ≤200 строк, чтобы не раздувать контекст агента.
- **Progressive disclosure.** Большой контент → в `references/<topic>.md` рядом со скиллом + явное указание «Read references/X.md when …», а не «see references/ for details».
- **Add what the agent lacks, omit what it knows.** Не объясняем, что такое React/RTK Query — только наши проектные правила и подводные камни.
- **Defaults, not menus.** Один путь выбран (shadcn, RTK Query, react-hook-form, zod). Альтернативы упоминаем только как escape hatch.
- **Procedures, not declarations.** Скилл учит **как подходить** к классу задач, не выдаёт готовый ответ для одного случая.
- **Match specificity to fragility.** Прескриптивные шаги — там, где порядок и формат важны (RTK теги, регистрация роутов, RBAC guard'ы). Свобода — там, где допустимы варианты (вёрстка карточки).
- **Coherent unit.** `add-rtk-endpoint` включает создание MSW handler и фикстуры — это одна логическая задача, не три. Отдельный `add-msw-handler` оставляем только для мокирования внешних API без RTK.
- **Gotchas-driven iteration.** Каждый раз, когда исправляем агента вручную, эта правка идёт в `Gotchas` соответствующего скилла. Это основной способ улучшения скиллов.
- **Bundled scripts.** Если в нескольких прогонах агент изобретает одну и ту же логику (валидация имени модуля, генерация barrel) — выносим в `scripts/` папки скилла.

**Что проверим отдельно перед заливкой каждого скилла:**

- `description` во frontmatter — короткое предложение с ключевыми фразами пользователя. Проверяем на нескольких формулировках, что агент действительно подбирает скилл (см. [Optimizing skill descriptions](https://agentskills.io/skill-creation/optimizing-descriptions)).
- Скилл не дублирует то, что уже есть в `CLAUDE.md` / `CONTRIBUTING.md` — там общие правила, в скилле — только специфика конкретной операции.

**Артефакт после фазы 1:** все 11 скиллов (Tier 1 + Tier 2) написаны на основе **реального опыта** их применения, имеют непустые `Gotchas`, и протестированы хотя бы на двух разных задачах того же типа.

**Принцип:** `.memory/MEMORY.md` — короткий индекс с описаниями файлов (≤150 символов на запись). Сам контент — в отдельных `.md`. Агент-фабрика на старте задачи читает `MEMORY.md` → `task_routing.md` → нужные доки.

### Документация на уровне модуля

В **каждом** модуле обязателен `modules/<name>/CLAUDE.md` (≤ 200 строк). Это локальный контекст, который агент читает **первым** при работе внутри модуля — раньше глобального `CLAUDE.md`/`ARCHITECTURE.md`.

```
modules/people/
├── CLAUDE.md       # ← обязательно, ≤200 строк
├── api/
├── model/
├── components/
├── hooks/
├── pages/
├── permissions.ts
└── index.ts
```

**Шаблон `modules/<name>/CLAUDE.md`:**

```markdown
# Module: <name>

## Purpose
1–2 предложения: за какой бизнес-домен отвечает модуль.

## Public API (что экспортит index.ts)
- Components: `EmployeeCard`, `EmployeeStatusBadge`
- Hooks: `useCurrentUser`, `useEmployees`
- Types: `Employee`, `EmployeeStatus`
- Pages (для router): `PeopleDirectoryPage`, `EmployeeDetailPage`

## Permissions, которые объявляет модуль
- `employees.view` — просмотр списка
- `employees.viewSalary` — видит колонку Salary
- (полный список + дефолтные роли — в `./permissions.ts`)

## Routes
- `/people` → `PeopleDirectoryPage` (требует `employees.view`)
- `/people/:id` → `EmployeeDetailPage` (требует `employees.view`)

## Data flow
- API: RTK Query (`peopleApi`), теги `Employee` / `Employee-LIST`.
- Source of truth — backend; локальный стейт — только UI-фильтры.
- Никакого дублирования server state в Redux.

## Dependencies
- shared/ui, shared/lib/rbac
- modules/auth → только типы (`Role`, `CurrentUser`)
- НЕ зависит от других модулей по UI/runtime

## Что внутри (карта)
- `api/peopleApi.ts` — endpoints
- `model/types.ts` — DTO + zod-схемы
- `components/` — доменные компоненты (≤300 строк каждый)
- `hooks/` — хуки модуля
- `pages/PeopleDirectoryPage/` — список
- `pages/EmployeeDetailPage/` — деталь + `tabs/`

## Локальные правила (если есть)
- Salary-related UI всегда оборачиваем в `<Can permission="employees.viewSalary">`.
- Former employees показываем отдельной collapsible-секцией.

## Open TODOs / known limitations
- Поиск пока клиентский — переедет в server-side при подключении бэка.
```

**Аналогичный `CLAUDE.md` (≤200 строк) обязателен для:**
- `src/shared/CLAUDE.md` — что лежит в shared, правила добавления.
- `src/widgets/CLAUDE.md` — что считается widget'ом, когда выносить.
- `src/app/CLAUDE.md` — провайдеры, порядок инициализации, роутер.
- `src/mocks/CLAUDE.md` — как добавлять handlers и фикстуры.

**Ограничение 200 строк** — намеренное: если модуль перерос, дробим на под-документы (`docs/people-onboarding.md` и т.п.) и оставляем в `CLAUDE.md` ссылки. Это держит контекст агента компактным.

## Критичные файлы для создания/реализации

- `vite.config.ts`, `tsconfig.json`, `tailwind` setup, `src/index.css`
- `src/app/router.tsx` — карта роутов с guard'ами
- `src/app/providers/StoreProvider.tsx`, `AuthProvider.tsx`, `ThemeProvider.tsx`
- `src/shared/api/baseApi.ts` — RTK Query базовый slice
- `src/shared/api/authProvider.ts` + `src/shared/api/mockAuthProvider.ts`
- `src/shared/types/rbac.ts`, `src/shared/config/permissions.ts`
- `src/shared/lib/rbac/Can.tsx`, `usePermission.ts`, `RequirePermission.tsx`
- `src/modules/auth/model/userSlice.ts`, `hooks/useCurrentUser.ts`, `index.ts`
- `src/modules/people/api/peopleApi.ts`, `model/types.ts`, `permissions.ts`, `index.ts`
- `src/widgets/Header/Header.tsx`
- `src/widgets/Sidebar/Sidebar.tsx`, `menuItems.ts`
- `src/modules/people/pages/PeopleDirectoryPage/*`
- `src/modules/people/pages/EmployeeDetailPage/*` (+ `tabs/OverviewTab.tsx`)
- `src/mocks/handlers/employees.ts`, `src/mocks/fixtures/employees.ts`, `src/mocks/browser.ts`
- `public/_redirects`

## План работ (для фабрики — каждая задача = отдельный PR)

1. **Bootstrap**: vite + ts + tailwind + eslint + prettier + husky. Hello-world.
2. **Конфиг для AI**: создать `CLAUDE.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `.memory/*`, `.claude/skills/*`.
3. **Store + Router + Theme + Layout-shell**.
4. **RBAC ядро**: типы, словарь, `<Can/>`, `usePermission`, `RequirePermission`. Юнит-тесты.
5. **Auth абстракция + mockAuthProvider + userSlice + role switcher (dev only)**.
6. **MSW + baseApi**, endpoint `GET /me`.
7. **Widget Header**.
8. **Widget Sidebar** (с фильтрацией меню по permissions).
9. **Employee entity + endpoints `GET /employees`, `GET /employees/:id`** + фикстуры.
10. **Page PeopleDirectory** (поиск, фильтры, KPI, таблица).
11. **Page EmployeeDetail** (Overview tab + плейсхолдеры остальных).
12. **Netlify deploy + e2e smoke (Playwright)**.

## Мои предпочтения и заметки

- **RTK Query, не axios+thunks.** Запрошенный стек + tag-based invalidation решает 90% задач CRUD без дополнительной логики.
- **MSW обязателен.** Альтернатива (статические моки в Redux) приведёт к тому же бардаку, что в tower (50+ data-файлов). MSW заставляет писать API-first.
- **Никаких глобальных Context для бизнес-данных** (как `EquipmentRegisterContext`, `LeaveRequestsContext` в tower) — всё через RTK Query. Context оставляем только для Theme/Auth/i18n.
- **PersonPage делим с самого начала.** В tower он 4421 строка. У нас: `EmployeeDetailPage` = layout + lazy-загружаемые `tabs/*.tsx`, каждый < 300 строк. Каждый tab — отдельный widget с своими endpoints.
- **Permission keys — namespaced строки**, не enum. Легче добавлять без миграции.
- **Жёсткие ESLint-правила** на импорт-границы (`eslint-plugin-boundaries`) и размер файла (`max-lines: 400`). Агенты иначе быстро деградируют качество.
- **CHANGELOG обязателен** — агенты-фабрики пишут запись на каждый PR; легко аудитить, что наделали.
- **Feature flags на старте не нужны** — нет реального трафика. Добавим, когда появится продакшен.
- **i18n не закладываем сейчас** (en-only), но именуем строки осмысленно, чтобы при необходимости вынести в i18next без рефакторинга.

## Code Style и правила (заимствовано из `brain-ai-front`, адаптировано под наш стек)

Эти правила пойдут в `CLAUDE.md` + `CONTRIBUTING.md` нового проекта. Агенты-фабрики обязаны соблюдать их при каждом PR.

### Структура файлов

```
src/widgets/Sidebar/
├── Sidebar.tsx         # named export
├── menuItems.ts        # данные/конфиг рядом с компонентом
├── Sidebar.test.tsx    # тесты колокатятся
└── index.ts            # re-export: export { Sidebar } from "./Sidebar"
```

- **Named exports для всех компонентов**, кроме страниц (`src/pages/**`) — там **default export** обязателен для `React.lazy`.
- Барреля `index.ts` на каждом уровне (`widgets/index.ts`, `entities/employee/index.ts` и т.д.).
- **Импорты только через alias `@/`** — никаких `../../../`. Конфиг в `vite.config.ts` + `tsconfig.json`.

### Порядок импортов

```ts
// 1. React и сторонние библиотеки
import { useState } from "react";
import { useNavigate } from "react-router";

// 2. Внутренние через alias (сначала верхние слои, потом нижние)
import { EmployeeCard } from "@/entities/employee";
import { Can } from "@/shared/lib/rbac";
import { Button } from "@/shared/ui/button";

// 3. Типы (отдельным блоком)
import type { Employee } from "@/entities/employee";
```

Пустая строка между группами. ESLint правило `import/order` энфорсит это автоматически.

### Naming

| Сущность | Стиль | Пример |
|---|---|---|
| Компоненты | PascalCase | `EmployeeCard.tsx`, `Sidebar.tsx` |
| Хуки | camelCase + `use` | `useCurrentUser`, `usePermission` |
| Константы | SCREAMING_SNAKE_CASE | `DEFAULT_PAGE_SIZE`, `ROUTES` |
| Типы/интерфейсы | PascalCase | `Employee`, `EmployeeCardProps` |
| Утилиты/функции | camelCase | `formatDate`, `cn` |
| Permission keys | dot.case | `employees.viewSalary` |
| Файлы тестов | `*.test.tsx` / `*.test.ts` | колокатятся рядом с кодом |

### Читаемость имён (жёсткое правило)

**Запрещены однобуквенные и неинформативные сокращения** для любых переменных, параметров, аргументов колбэков, индексов и т.д. Имя должно говорить, **что это**, а не «как короче».

```ts
// ❌ ПЛОХО
data.map((d) => d.name);
employees.filter((e) => e.status === "active");
users.forEach((u, i) => console.log(i, u));
arr.reduce((a, c) => a + c.salary, 0);
const res = await fetch(...);
const { d } = props;

// ✅ ХОРОШО
employees.map((employee) => employee.name);
employees.filter((employee) => employee.status === "active");
users.forEach((user, index) => console.log(index, user));
employees.reduce((total, employee) => total + employee.salary, 0);
const response = await fetch(...);
const { data } = props;
```

Правила:
- В колбэках `map/filter/find/reduce/forEach` используем **полное имя элемента в единственном числе**: `employees.map((employee) => ...)`, `projects.find((project) => ...)`.
- Аккумуляторы `reduce` именуем по смыслу: `total`, `acc` допустим только в очень общих утилитах в `shared/lib`.
- Индексы — `index`, не `i`. Ключи — `key`, не `k`. События — `event`, не `e`.
- Промежуточные переменные — `response`, `result`, `payload`, не `res`, `r`, `p`.
- Сокращения допустимы только для **общепринятых аббревиатур домена**: `id`, `url`, `dto`, `api`, `db`. И даже тогда — в составе имени (`employeeId`, не просто `id` в широком скоупе).
- Деструктуризация не оправдывает короткое имя: `const { d: data } = obj` — нет, нужно изначально называть поле `data`.

ESLint enforcement:
```jsonc
{
  "id-length": ["error", { "min": 2, "exceptions": ["_"] }],
  "@typescript-eslint/naming-convention": [
    "error",
    { "selector": "variableLike", "format": ["camelCase", "PascalCase", "UPPER_CASE"] }
  ]
}
```

Цель — код должен читаться как описание задачи. Если имя не понятно без контекста — переименовать.

### Структура файла компонента (строгий порядок)

```tsx
// 1. Imports (по группам, см. выше)
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import type { Employee } from "@/entities/employee";

// 2. Локальные типы
interface EmployeeCardProps {
  employee: Employee;
  onSelect?: (id: string) => void;
}

// 3. Локальные константы (если нужны)
const STATUS_LABELS: Record<Employee["status"], string> = {
  active: "Active",
  bench: "Bench",
  dismissed: "Dismissed",
};

// 4. Компонент
export function EmployeeCard({ employee, onSelect }: EmployeeCardProps) {
  // 4.1 — Хуки (useState, useQuery, useMemo, ...)
  const [isHovered, setIsHovered] = useState(false);

  // 4.2 — Производные значения
  const statusLabel = STATUS_LABELS[employee.status];

  // 4.3 — Хэндлеры
  const handleClick = () => {
    onSelect?.(employee.id);
  };

  // 4.4 — Ранний return (loading/empty/error)
  if (!employee) return null;

  // 4.5 — Render
  return (
    <div onClick={handleClick}>
      {/* ... */}
    </div>
  );
}
```

### Отступы и логические блоки

- **Пустая строка между логическими секциями** внутри компонента: между хуками и хэндлерами, между группой хэндлеров и `return`, между разными `useEffect`.
- **Внутри JSX**: пустая строка между крупными смысловыми блоками (`<Header>` ↔ `<Main>` ↔ `<Footer>`).
- Внутри функции — пустые строки разделяют шаги (валидация → вычисление → side-effect → return).
- Не более **1 пустой строки подряд** (ESLint: `no-multiple-empty-lines: { max: 1 }`).

### Комментарии

**По умолчанию комментариев нет.** Хороший код объясняется именами.

Комментировать нужно только когда:
- неочевидно **ПОЧЕМУ** (бизнес-правило, костыль для бага, неинтуитивный трейд-офф);
- регулярное выражение или сложная формула;
- TODO с указанием контекста (`// TODO(rbac): унести в server-side check когда подключим SSO`).

Запрещено:
- Комментарии, описывающие **что** делает код (`// increment counter`).
- Закомментированный код (удалять, git помнит).
- JSDoc на каждую функцию — только для публичного API в `shared/`.

Формат TODO: `// TODO(scope): описание` — scope позволяет грепать.

### Размер файлов и сплит компонентов

- `max-lines: 300` (ESLint warn), 400 — error.
- `max-lines-per-function: 80`.
- Если компонент перевалил 200 строк — разбить:
  - Подкомпоненты → в отдельные файлы рядом (`EmployeeCard/Header.tsx`, `EmployeeCard/Stats.tsx`).
  - Хэндлеры с тяжёлой логикой → в кастомные хуки (`useEmployeeActions`).
  - Конфиги/константы → в соседний файл (`EmployeeCard.config.ts`).

**PersonPage в tower = 4421 строк = anti-pattern.** У нас `EmployeeDetailPage` = layout + lazy tabs, каждый tab < 250 строк.

### Стилизация (Tailwind + shadcn)

- Используем `cn()` из `shared/lib/utils.ts` для условных классов.
- **Никаких inline-стилей** (`style={{ ... }}`), кроме случаев, когда значение реально динамическое (например, `--progress: ${pct}%`).
- Цвета — только через токены темы (`text-foreground`, `bg-card`), никаких хардкод hex.
- Длинные `className` разбиваем на строки через `cn()`:
  ```tsx
  <div className={cn(
    "flex items-center gap-2 rounded-md border p-3",
    "hover:bg-accent transition-colors",
    isActive && "border-primary bg-accent",
  )}>
  ```
- Анимации/keyframes — через Tailwind конфиг, не через inline CSS.

### Формы

- **Все формы — `react-hook-form` + `zod` resolver.** Никаких `useState` для полей.
- Один общий каталог обёрток в `shared/ui/form/*` (`FormField`, `FormInput`, `FormSelect`).
- DTO для API и схема zod — рядом, типы выводятся через `z.infer`.

### API layer (RTK Query)

```ts
export const employeeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEmployees: build.query<Employee[], EmployeeFilters>({
      query: (filters) => ({ url: "/employees", params: filters }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Employee" as const, id })), "Employee"]
          : ["Employee"],
    }),
    getEmployee: build.query<Employee, string>({
      query: (id) => `/employees/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Employee", id }],
    }),
  }),
});

export const { useGetEmployeesQuery, useGetEmployeeQuery } = employeeApi;
```

Правила:
- Эндпоинты колокатятся в `entities/<entity>/api/`.
- Теги — типизированные (`type: "Employee" as const`).
- Списочные query, чьи данные часто меняются → `refetchOnMountOrArgChange: true`.
- DTO в `entities/<entity>/model/types.ts`.

### Хуки и стейт

- **Локальный стейт** — `useState`/`useReducer`.
- **Серверный стейт** — RTK Query (не дублируем в локальный стейт).
- **Глобальный стейт** — Redux slices только для: `auth`, `ui` (theme, sidebar collapsed). Бизнес-данные **никогда** не дублируются в slices.
- Кастомные хуки — `arrow function`-стиль, мемоизация хэндлеров через `useCallback` только когда они передаются вниз в мемоизированные компоненты.

### Функции

- **Arrow-functions** для компонентов и утилит, кроме случая когда нужен hoisting (редко).
- Деструктуризация props в сигнатуре.
- Ранний return вместо вложенных `if`.

### Типы

- `strict: true` в `tsconfig`. `noUncheckedIndexedAccess: true`.
- Никаких `any` (ESLint error). При необходимости — `unknown` + narrow.
- `interface` для публичных props, `type` для unions/intersections — последовательно.
- Доменные типы — в `entities/<entity>/model/types.ts`, экспортятся через barrel.

### ESLint enforcement (ключевые правила)

```jsonc
{
  "no-multiple-empty-lines": ["error", { "max": 1 }],
  "max-lines": ["warn", 300],
  "max-lines-per-function": ["warn", 80],
  "import/order": ["error", { "newlines-between": "always", "groups": [...] }],
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/consistent-type-imports": "error",
  "boundaries/element-types": "error"   // импорт-границы FSD
}
```

`prettier` + `prettier-plugin-tailwindcss` для авто-сортировки классов. Husky pre-commit: `lint-staged` → `eslint --fix` + `prettier --write`.

### Чеклист агента перед PR (выносим в `.memory/invariants_checklist.md`)

- [ ] Файл < 300 строк? Если нет — разбит на подкомпоненты.
- [ ] Импорты через `@/`, отсортированы по группам.
- [ ] Named export (default только для pages).
- [ ] Нет inline `style={{}}` без реальной необходимости.
- [ ] Нет комментариев, описывающих *что* делает код.
- [ ] Все формы — на `react-hook-form` + `zod`.
- [ ] RBAC проверка через `<Can/>` / `usePermission`, не через сравнение ролей напрямую.
- [ ] Серверные данные — только через RTK Query, не дублируются в Redux/state.
- [ ] `npm run check` (lint + typecheck + test) зелёный.
- [ ] CHANGELOG обновлён.

## Verification (как проверить, что фаза 1 готова)

1. `npm run dev` → открывается `/people`, видна таблица из 18 сотрудников.
2. Клик по строке → `/people/U01` → Overview с данными.
3. В dev-режиме role-switcher переключает роль; меню в Sidebar меняется; salary-колонка появляется/исчезает.
4. `npm run lint` + `npm run typecheck` + `npm run test` зелёные.
5. Playwright smoke: login (mock) → directory → detail → logout.
6. `.memory/MEMORY.md` + все ключевые `.md` присутствуют, индексируют друг друга.
7. Deploy на Netlify preview, SPA-redirect работает.
