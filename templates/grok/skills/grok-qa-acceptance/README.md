# grok-qa-acceptance (user-global)

Contract library for the **Grok QA** product path (Trellis frontend-oriented full acceptance).

## Version

- `version`: `1.2.0-trellis-global`
- Pipeline + coverage gate + full HTML + seed/cleanup + failure_class (2026-07-17)

## Install locations

| Layer | Path |
|-------|------|
| Agent | `~/.grok/agents/grok-qa.md` |
| Skill | `~/.grok/skills/grok-qa-acceptance/` |

Windows: `C:\Users\<you>\.grok\...`

## Full flow

```text
coverage gate
  -> cases (if thin)
  -> ui (Midscene: read_only then mutation)
  -> api (narrow smoke)
  -> review
  -> gate
  -> full HTML (all test-cases.jsonl)
```

## Scripts

```text
scripts/check_coverage_gate.py
scripts/run_midscene_pipeline.py
scripts/update_case_status.py
scripts/check_test_cases.py
scripts/generate_full_report_html.py
```

## Key references

- `state-machine.md` — stages, coverage gate, completion
- `report-format.md` — full HTML mandatory
- `midscene-emcpc-patterns.md` — Element UI / async form
- `fixture-seed-cleanup.md` — isolation data
- `evidence-run-layout.md` — single run-id
- `failure-class.md` — product vs harness

## Deliverables

| File | Role |
|------|------|
| `test-run-*-grok-full-acceptance.html` | **Primary** user-facing report |
| `test-run-latest-grok-full-acceptance.html` | Stable alias |
| `test-run-*-grok-acceptance.md` | Narrative review/gate |
| `test-run-*-grok-ui-acceptance.html` | Only if user asked UI-only |

## Same-name override

Project `.agents/skills/grok-qa-acceptance/` **fully replaces** this package (no merge). Keep complete.
