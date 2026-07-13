# Platform Boundary: Grok QA Path

Non-overlapping ownership so Grok QA does not fight other acceptance orchestrators.

## Grok path identity

| Item | Grok path |
|------|-----------|
| Entry | agent `grok-qa` (`~/.grok/agents/` or project `.grok/agents/`) |
| Contract library | `grok-qa-acceptance` skill (user or project same-name full package) |
| Orchestrator | single agent `grok-qa`, serial stages |
| Model binding | current Grok model + local Midscene runtime config |
| Dispatch mode label | `grok-agent` (preferred) or `grok-skill` (fallback) |
| Routing evidence | `evidence/grok-qa-routing-*.jsonl` |
| Report preference | `test-run-YYYYMMDD-grok-acceptance.md` |

## Product intent

```text
cases (UI-first) -> ui (core) -> api (narrow) -> review -> gate
```

Frontend-oriented full loop for Trellis tasks — not a multi-model router clone.

## Shared task artifacts (allowed)

Under `.trellis/tasks/<task>/`:

- `prd.md` / `design.md` / `implement.md` (read)
- `test-cases.jsonl` / `test-cases.md`
- `midscene/**`
- `evidence/**` (Grok-specific filename prefixes)
- `test-run-*.md`

Shared product files are OK. Shared **orchestrators** are not.

## Hard isolation rules

1. Do not call OpenCode CLI (`opencode` / `opencode.cmd`) or OpenCode Task routers as the acceptance orchestrator.
2. Do not write OpenCode routing evidence prefixes (`native-subagent-routing-*`, `model-routing-*`) for Grok runs.
3. Do not edit OpenCode project config as part of Grok QA.
4. If another path's evidence exists, Grok may read it for context but must append only `grok-qa-routing-*.jsonl`.
5. If the user explicitly wants a non-Grok acceptance product, stop and tell them to use that product — do not mix paths in one run.

## When user is ambiguous

- Inside a Grok session with “开始测试 / 用 Grok 验收” → Grok path
- Explicit “用 OpenCode / local-acceptance” → refuse Grok orchestration for that request

## Skill helpers

Older project skills (`test-case-*`) may remain as helpers. For Grok frontend QA product work, **`grok-qa` + `grok-qa-acceptance`** are authoritative.
