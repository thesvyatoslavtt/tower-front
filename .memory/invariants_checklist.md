# Invariants checklist (перед PR)

- [ ] `yarn check` зелёный (lint + typecheck + test).
- [ ] Файл < 300 строк? Если нет — разбить.
- [ ] Импорты через `@/`, отсортированы по группам, между группами пустая строка.
- [ ] Named export (default только для pages под `React.lazy`).
- [ ] Нет inline `style={{}}` без реальной необходимости.
- [ ] Цвета через токены темы (`var(--color-*)` или Tailwind classes), не хардкод hex.
- [ ] Нет комментариев, описывающих *что* делает код.
- [ ] Нет однобуквенных имён в колбэках (`employees.map((employee) => …)`).
- [ ] Все формы — на `react-hook-form` + `zod`.
- [ ] RBAC проверки — через `<Can/>` / `usePermission`, не через сравнение ролей.
- [ ] Server state — только RTK Query, не дублируется в Redux/state.
- [ ] Импорт из модуля — только через `@/modules/<name>` (barrel), не внутрь.
- [ ] CHANGELOG.md обновлён.
- [ ] Если затронут Public API / Routes / Permissions модуля — обновлён `modules/<name>/CLAUDE.md`.
- [ ] Если задача визуальная — в PR ссылка на reference-экран tower.
