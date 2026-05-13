# Task routing

| Task type                  | Read before starting                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| New module                 | CLAUDE.md, docs/architecture.md, docs/module-claude-template.md, .claude/skills/add-module/SKILL.md                        |
| New page                   | modules/<m>/CLAUDE.md, docs/architecture.md (Routing), .claude/skills/add-page/SKILL.md                                    |
| New RTK endpoint           | modules/<m>/CLAUDE.md, docs/code-style.md (API layer), .claude/skills/add-rtk-endpoint/SKILL.md, src/shared/api/baseApi.ts |
| Permission / role          | docs/rbac.md, .claude/skills/add-permission/SKILL.md                                                                       |
| Auth / session             | docs/auth.md                                                                                                               |
| Component in shared/ui     | src/shared/CLAUDE.md, docs/code-style.md (Styling, Component file structure), .claude/skills/add-component/SKILL.md        |
| Widget                     | src/widgets/CLAUDE.md, docs/architecture.md (widgets layer), .claude/skills/add-widget/SKILL.md                            |
| Form / Table               | docs/code-style.md (Forms / API layer), .claude/skills/add-form/SKILL.md or add-table/SKILL.md                             |
| MSW mock                   | src/mocks/CLAUDE.md (once it exists), .claude/skills/add-msw-handler/SKILL.md                                              |
| Test                       | .claude/skills/add-test/SKILL.md, src/test/setup.ts                                                                        |
| Splitting a large file     | docs/code-style.md (File and function size), .claude/skills/split-large-file/SKILL.md                                      |
| Style / lint rule change   | docs/code-style.md (ESLint enforcement), eslint.config.js                                                                  |
| Roadmap update             | docs/roadmap.md                                                                                                            |
| Skill creation / iteration | docs/skills.md                                                                                                             |
| Visual task                | docs/architecture.md (Theming) + tower reference (https://tower-artkai.netlify.app)                                        |
