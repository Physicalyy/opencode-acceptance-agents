# Changelog

## 0.5.0

### Grok (sync from `~/.grok` practice @ 2026-07-17)

- **grok-qa / grok-qa-acceptance → 1.2.0-trellis-global**
- Full flow: `coverage-gate → cases (if thin) → ui → api → review → gate → full HTML`
- Skill **scripts/** shipped with the package:
  - `check_coverage_gate.py` — PRD/UI theme coverage before UI exec
  - `run_midscene_pipeline.py` — prepare/finalize Midscene run-id layout
  - `update_case_status.py` — safe JSONL status / evidence / failure_class updates
  - `check_test_cases.py` — P0/P1 gate fallback when project checker missing
  - `generate_full_report_html.py` — full-scope HTML from all cases
- New references: `evidence-run-layout`, `failure-class`, `fixture-seed-cleanup`, `midscene-emcpc-patterns` (Element UI patterns)
- Primary deliverable: `test-run-*-grok-full-acceptance.html` (+ latest alias); Markdown narrative retained
- Installer selfcheck/verify require coverage-gate script; AGENTS managed block updated

## 0.4.0

### OpenCode (from HEMS Trellis multi-model practice)

- **Trellis-only** product assumption for acceptance agents
- Multi-model stage matrix kept as OpenCode feature:
  - cases → DeepSeek
  - ui → Qwen multimodal
  - **api (new)** → DeepSeek narrow smoke
  - review → GPT + runner compliance + soft gate
- `acceptance-agent` state machine: cases → ui → api → review → gate; fresh mode
- Env precheck + Midscene-required for midscene runner (no Playwright-only pass)
- Slash commands: `/acceptance/auto`, `auto-fresh`, `cases`, `ui`, `api`, `review`
- Skill routing aligned with HEMS natural-language + fresh triggers
- Installer copies commands; verify checks api agent + commands + test-case-generator
- Detect gaps for missing `acceptance-api` and missing `.trellis/`

### Other

- `acceptance.defaults.md` stub also on OpenCode install into Trellis repos
- Docs emphasize multi-model OpenCode vs single-agent Grok

## 0.3.0

- Installer `--detect` gaps, `--yes`, `--verify`, `--selfcheck`, TTY interactive
- Project skill `install-acceptance-agents`
- Grok templates + dual runtime

## 0.2.0

- Grok runtime templates; `--runtime opencode|grok|all`

## 0.1.0

- Initial OpenCode acceptance agents + skills
