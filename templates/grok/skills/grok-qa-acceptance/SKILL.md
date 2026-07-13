---
name: grok-qa-acceptance
version: 1.1.0-trellis-global
package: opencode-acceptance-agents
source: generalized from HEMS-git grok-qa-acceptance; shipped via templates/grok
description: "Contract library and playbook for the Grok QA agent (grok-qa). Trellis frontend-oriented acceptance: UI-first cases, Midscene UI, narrow API smoke, review, and gate. Use when running or maintaining Grok-path acceptance. Prefer the grok-qa agent as entry identity."
---

# Grok QA Acceptance (Contract Library)

User-global skill package for Trellis projects (`~/.grok/skills/grok-qa-acceptance/`).

A project may ship a **same-named full copy** under `.agents/skills/grok-qa-acceptance/` (project wins, full package replace — not merge). Do not replace the project package with a thin stub of the same name.

## Preferred Entry

| Layer | Path | Role |
|-------|------|------|
| **Agent (entry)** | `~/.grok/agents/grok-qa.md` or project `.grok/agents/grok-qa.md` | Session identity + orchestration |
| **Skill (contracts)** | this package (or project same-name override) | Schema, precheck, Midscene limits, API evidence, report format |

## Purpose

Frontend-oriented **full** acceptance loop for Trellis tasks:

```text
cases (UI-first) -> ui (Midscene core) -> api (narrow smoke) -> review -> gate
```

Solves **frontend test verification**, not backend-only QA. Backend-only tasks may skip UI when no UI cases exist (see `references/state-machine.md`).

## Platform Boundary (summary)

| Do | Do not |
|----|--------|
| Use Grok agent/skill path | Call OpenCode `opencode` / `/local-acceptance/*` as the orchestrator |
| Write `evidence/grok-qa-routing-*.jsonl` | Reuse OpenCode routing evidence filenames |
| Prefer `test-run-*-grok-acceptance.md` | Claim multi-model OpenCode routing succeeded |
| Edit only `.trellis/tasks/<task>/**` acceptance artifacts | Edit product source to make tests green |

Details: `references/platform-boundary.md`.

## Required References

Read before any stage work:

1. `references/platform-boundary.md`
2. `references/project-defaults.md`
3. `references/state-machine.md`
4. `references/case-schema.md`
5. `references/risk-gate.md`
6. `references/env-precheck.md`
7. `references/midscene-limitations.md`
8. `references/api-evidence.md`
9. `references/report-format.md`

## Flow Summary

### Fresh mode triggers

`从头开始` / `重新生成` / `fresh` / `clean` / `忽略旧用例` / `忽略旧 test-cases` / `ignore old cases` / `regenerate`

→ always `cases -> ui -> api -> review -> gate` (skip ui only when no UI cases after generation)

### Stage intents

| Stage | Intent |
|-------|--------|
| cases | UI-first case generation; no execution; no pass marks |
| ui | Env precheck + Midscene/UI execution (core value when UI cases exist) |
| api | Frontend-supporting smoke only (login/critical reads) |
| review | Evidence sufficiency; no invented results |
| gate | Prefer `python ./.trellis/scripts/project/check_test_cases.py <task>`; missing script → soft-fail |

### Task resolution

1. `.trellis/tasks/...` path token  
2. slug → `.trellis/tasks/<slug>/`  
3. `python ./.trellis/scripts/task.py current --source`  
4. else ask user  

### Evidence

```text
<task>/evidence/grok-qa-routing-YYYYMMDD-HHmmss.jsonl
```

Preferred fields: `agent=grok-qa`, `skill=grok-qa-acceptance`, `dispatchMode=grok-agent` (or `grok-skill` fallback).

### Report

```text
<task>/test-run-YYYYMMDD-grok-acceptance.md
```

## Safety

- Write acceptance artifacts under `.trellis/tasks/<task>/**` only
- Do not edit product source trees unless the user explicitly requests a product fix outside QA
- Do not start services unless the user asks
- No secrets in task artifacts
- No unauthorized mutation/destructive cases
- Honor project `no_edit_globs` from `acceptance.defaults.md` when present

## Sync Policy

- **Global package** = default truth for new Trellis repos on this machine
- **Project same-name package** = full override while working in that repo (must stay complete)
- When fixing generic contracts: update global first, then cherry-pick into project copies that still need the fix

## Relationship To Other Skills

- Project helpers such as `test-case-generator` / `test-case-acceptance` / `test-case-midscene-acceptance` may still exist; **`grok-qa` + this package** are the Grok QA product entry for the full frontend-oriented loop.
- OpenCode acceptance agents (if any) are a separate path; do not merge runs.
