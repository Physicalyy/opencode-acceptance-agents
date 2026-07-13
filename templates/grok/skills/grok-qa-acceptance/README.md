# grok-qa-acceptance

Contract library for the **Grok QA** product path (Trellis frontend-oriented full acceptance).

This tree is the **template** shipped by [opencode-acceptance-agents](https://github.com/Physicalyy/opencode-acceptance-agents) under `templates/grok/`.

## Version

- `version`: `1.0.0-trellis-global`
- `source`: generalized from HEMS-git project package @ 2026-07-12

## Install (recommended)

```bash
npx github:Physicalyy/opencode-acceptance-agents --runtime grok --target <project-root>
```

## Install locations (after installer)

| Layer | Path | Scope |
|-------|------|-------|
| **Agent** | `~/.grok/agents/grok-qa.md` | All projects (unless project `.grok/agents/grok-qa.md` overrides) |
| **Skill** | `~/.grok/skills/grok-qa-acceptance/` | User-global |
| **Project agent** | `<repo>/.grok/agents/grok-qa.md` | Project override |
| **Project skill** | `<repo>/.agents/skills/grok-qa-acceptance/` | Project override (full replace of same name) |

On Windows: `C:\Users\<you>\.grok\...`

Open `/config-agents` (or select agent `grok-qa`) for the agent entry. Grok auto-discovers these paths after a new session.

## Same-name override (important)

Grok skills are **deduplicated by name** with **project > user**. A project package **fully replaces** this global package for that session — it does **not** merge.

Therefore:

- Global package must stay **complete**
- Project copies (if any) must also stay **complete**, not thin stubs with the same name

## Isolation

- Does not live under project `.opencode/`
- Does not call OpenCode Task / `opencode` as orchestrator
- Writes `dispatchMode=grok-agent` and `evidence/grok-qa-routing-*.jsonl`
- Prefers `test-run-YYYYMMDD-grok-acceptance.md`

## Full flow

```text
cases (UI-first)
  -> ui (Midscene core; skip if no UI cases)
  -> api (narrow smoke for UI)
  -> review
  -> gate (check_test_cases.py if present)
```

## Project defaults

See `references/project-defaults.md` and optional repo file:

```text
.trellis/acceptance.defaults.md
.trellis/acceptance.defaults.local.md   # optional local override
```

## Layout

```text
~/.grok/agents/grok-qa.md
~/.grok/skills/grok-qa-acceptance/
  SKILL.md
  README.md
  references/
    platform-boundary.md
    project-defaults.md
    state-machine.md
    case-schema.md
    risk-gate.md
    env-precheck.md
    midscene-limitations.md
    api-evidence.md
    report-format.md
```

## Example prompts

```text
用 Grok 验收 .trellis/tasks/<task-slug>
<task-slug> 从头开始，忽略旧用例，开始测试任务
对当前任务做前端 UI 验收
```

## Sync

1. Fix generic contracts here first.
2. Cherry-pick into project full copies that still need the change.
3. Bump `version` in both places when behavior changes.
