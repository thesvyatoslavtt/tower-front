# Contributing — Tower v2

Рецепты для типовых задач. Подробнее — `.claude/skills/<name>/SKILL.md`.

## Базовые правила

- Перед PR: `yarn check` зелёный.
- CHANGELOG.md — запись на каждый PR.
- Файл > 300 строк — разбить.
- См. [CLAUDE.md](CLAUDE.md), [ARCHITECTURE.md](ARCHITECTURE.md), [PLAN.md](PLAN.md).

## Рецепты (стабы — заполняем по факту первого реального применения, см. PLAN.md → "Методология создания скиллов")

### Добавить модуль
Скилл `add-module`. См. `.claude/skills/add-module/SKILL.md`.

### Добавить страницу
Скилл `add-page`.

### Добавить RTK endpoint
Скилл `add-rtk-endpoint`. Не забыть `providesTags` / `invalidatesTags` и MSW handler.

### Добавить permission
Скилл `add-permission`. Обновить `modules/<m>/permissions.ts` и `docs/rbac.md`.

### Добавить компонент / widget / форму / таблицу / MSW handler / тест
Скиллы `add-component`, `add-widget`, `add-form`, `add-table`, `add-msw-handler`, `add-test`.

### Разбить большой файл
Скилл `split-large-file`.

## Дизайн-источник

Визуал берём из `Desktop/artkai/tower` (https://tower-artkai.netlify.app). При работе над страницей/компонентом — указать ссылку на reference-экран в PR-описании.
