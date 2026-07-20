# Grok QA Case Schema

## Output Files

Under `.trellis/tasks/<task>/`:

- `test-cases.jsonl` — source of truth
- `test-cases.md` — Chinese human table aligned with JSONL
- optional `midscene/cases/*` — UI automation drafts only

## JSONL Object

One JSON object per line:

```json
{
  "id": "TC_UI_001",
  "title": "keyword search shows highlighted hits",
  "priority": "P0",
  "area": "frontend",
  "type": "ui",
  "runner": "midscene",
  "verification": "auto",
  "risk": "read_only",
  "preconditions": ["frontend reachable at project frontend_url", "logged in as authorized test user"],
  "test_data": ["keyword: sample"],
  "steps": ["open target route from task docs", "input keyword", "click search"],
  "expected": ["result list visible", "hit fragment contains highlight"],
  "status": "pending",
  "evidence": "",
  "notes": "",
  "failure_class": ""
}
```

Use routes/URLs from task docs or `.trellis/acceptance.defaults.md` — do not invent project-specific ports in the schema examples.

## Required Fields

| Field | Rules |
|-------|-------|
| `id` | Stable `TC_<AREA>_<NNN>` e.g. `TC_UI_001`, `TC_API_001` |
| `title` | Concrete behavior under test |
| `priority` | `P0` \| `P1` \| `P2` |
| `area` | e.g. `frontend`, `backend`, `api`, `config` |
| `type` | `ui` \| `frontend` \| `e2e` \| `api` \| `integration` \| `unit` \| `manual` |
| `runner` | `midscene` \| `playwright` \| `api` \| `curl` \| `manual` \| `script` |
| `verification` | `auto` \| `manual` |
| `risk` | `read_only` \| `data_mutation` \| `destructive` \| `external_cost` |
| `preconditions` | string array |
| `test_data` | string array |
| `steps` | string array |
| `expected` | observable outcomes array |
| `status` | see below |
| `evidence` | path/summary string; empty when pending |
| `notes` | optional caveats, drift, timing sensitivity |
| `failure_class` | optional after execution: `product` \| `harness` \| `env` \| `data` \| `flake` (see `failure-class.md`) |

Legacy fields from older generators are acceptable on read. New Grok-generated cases should include the full schema above.

Update status only via `scripts/update_case_status.py` (or equivalent careful JSONL rewrite). **Do not** concatenate JSON objects with shell string `\n` joins.

## Status Enum

- `pending` — not run
- `passed` — verified with evidence
- `failed` — actual contradicts expected
- `blocked` — environment/config/auth/data blocker
- `deferred` — intentional P2 postpone with reason in evidence/notes
- `partial` — insufficient evidence to claim pass

## UI-first Generation Policy

Default to UI/Midscene cases:

- Prefer `area=frontend`, `type=ui`, `runner=midscene`, `risk=read_only`, `verification=auto`
- Focus on visible behavior, navigation, forms, results, permissions entry, error states, screenshot-verifiable outcomes
- Prefer 8–18 focused UI cases for a page feature

Add non-UI cases only when:

1. User explicitly asks for API/backend cases
2. A P0/P1 criterion cannot be proven via UI
3. Minimal API smoke is needed as UI precondition

Do **not** generate by default:

- compile / package presence only
- source static inspection
- config-file existence only
- DB internal implementation details

Those belong to `trellis-check`, not QA acceptance.

## Fresh Generation Rules

- Source of truth: `prd.md`, optional `design.md`, optional `implement.md`
- Ignore old case status/evidence as generation input
- Recreate jsonl/md; reset status/evidence
- Preserve historical evidence files and old reports on disk

## Requirement Drift

Cases are requirement-driven, not code-driven.

If user reports UI/API differs from generated case:

1. Do not silently rewrite expected to match code
2. Note possible drift in `notes`
3. Ask whether prd/design should update or the implementation is a defect

## Markdown Table Columns

`test-cases.md` columns:

`ID | Area | Priority | Type | Runner | Risk | Title | Test Data | Expected | Status`
