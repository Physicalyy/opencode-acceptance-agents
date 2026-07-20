---
name: grok-qa-acceptance
version: 1.2.0-trellis-global
package: opencode-acceptance-agents
source: generalized from HEMS + 2026-07-17 pipeline practice; shipped via templates/grok
description: "Contract library and playbook for the Grok QA agent (grok-qa). Trellis frontend-oriented acceptance: UI-first cases, coverage gate, Midscene pipeline, seed/cleanup, full HTML report, review, and gate."
---

# Grok QA Acceptance (Contract Library)

User-global skill package for Trellis projects (`~/.grok/skills/grok-qa-acceptance/`).

A project may ship a **same-named full copy** under `.agents/skills/grok-qa-acceptance/` (project wins, full package replace — not merge).

## Preferred Entry

| Layer | Path | Role |
|-------|------|------|
| **Agent (entry)** | `~/.grok/agents/grok-qa.md` or project `.grok/agents/grok-qa.md` | Session identity + orchestration |
| **Skill (contracts)** | this package (or project same-name override) | Schema, precheck, Midscene, reports, scripts |

## Purpose

```text
coverage gate -> cases (if thin) -> ui (Midscene) -> api (narrow) -> review -> gate -> full HTML
```

## Required References

1. `references/platform-boundary.md`
2. `references/project-defaults.md`
3. `references/state-machine.md`
4. `references/case-schema.md`
5. `references/risk-gate.md`
6. `references/env-precheck.md`
7. `references/midscene-limitations.md`
8. `references/midscene-emcpc-patterns.md`
9. `references/fixture-seed-cleanup.md`
10. `references/evidence-run-layout.md`
11. `references/failure-class.md`
12. `references/api-evidence.md`
13. `references/report-format.md`

## Scripts (use these; do not shell-handcraft JSONL)

| Script | Purpose |
|--------|---------|
| `scripts/check_coverage_gate.py` | PRD/UI theme coverage before UI exec |
| `scripts/run_midscene_pipeline.py` | prepare run-id dir; finalize summary→jsonl→full HTML |
| `scripts/update_case_status.py` | safe jsonl status/evidence/failure_class updates |
| `scripts/check_test_cases.py` | P0/P1 gate when project checker missing |
| `scripts/generate_full_report_html.py` | full-scope HTML from all jsonl cases |

Windows examples:

```bash
python "%USERPROFILE%\.grok\skills\grok-qa-acceptance\scripts\check_coverage_gate.py" --task .trellis/tasks/<slug>
python "%USERPROFILE%\.grok\skills\grok-qa-acceptance\scripts\run_midscene_pipeline.py" prepare --task .trellis/tasks/<slug>
python "%USERPROFILE%\.grok\skills\grok-qa-acceptance\scripts\run_midscene_pipeline.py" finalize --task .trellis/tasks/<slug> --run-dir <evidence/midscene-run-grok-...>
python "%USERPROFILE%\.grok\skills\grok-qa-acceptance\scripts\check_test_cases.py" .trellis/tasks/<slug>
python "%USERPROFILE%\.grok\skills\grok-qa-acceptance\scripts\generate_full_report_html.py" .trellis/tasks/<slug>
```

## Flow Summary

### Fresh mode

`从头开始` / `重新生成` / `fresh` / `忽略旧用例` → always regenerate cases first, then full loop.

### Stage intents

| Stage | Intent |
|-------|--------|
| cases | UI-first generation; also when coverage gate fails |
| ui | Env precheck + seed (if mutation) + Midscene; read_only then mutation |
| api | Narrow frontend smoke |
| review | Evidence sufficiency; product vs harness classification |
| gate | Project `check_test_cases.py` or skill script |
| report | **Mandatory** full HTML for full runs |

### UI coverage gate

On `开始测试` / `执行验收` / `跑 UI`:

```bash
python scripts/check_coverage_gate.py --task <task>
```

Non-zero → expand cases before UI execution (unless user says 仅执行现有用例).

### Midscene execution order

1. `check_coverage_gate.py`
2. env precheck (`env-precheck.md` + credentials + optional DB fingerprint)
3. `run_midscene_pipeline.py prepare` → single run-id under `evidence/midscene-run-grok-<id>/`
4. session setup (never redacted yaml as password source)
5. Midscene **read_only** cases
6. API **seed** isolation fixtures if mutation needs rows (`fixture-seed-cleanup.md`)
7. Midscene **mutation** cases
8. **cleanup** isolation data
9. `run_midscene_pipeline.py finalize` (jsonl + full HTML)
10. review → gate → final reply with full HTML first

Failed Midscene cases: at most **one** automated re-attempt after harness fix, under same run-id `attempts/`.

### Report

**Primary:**

```text
<task>/test-run-YYYYMMDD-grok-full-acceptance.html
<task>/test-run-latest-grok-full-acceptance.html
```

**Markdown narrative:** `test-run-YYYYMMDD-grok-acceptance.md`  
**UI-only HTML:** only if user asked UI-only.

### Evidence

```text
<task>/evidence/grok-qa-routing-YYYYMMDD-HHmmss.jsonl
<task>/evidence/midscene-run-grok-<runId>/
```

## Safety

- Write only `.trellis/tasks/<task>/**` acceptance artifacts
- No product source edits unless user leaves QA mode
- No secrets in task artifacts
- No unauthorized destructive cases
- Honor `no_edit_globs`

## Sync Policy

- Global package = default for this machine
- Project same-name package = full replace
- Fix generic contracts in global first
