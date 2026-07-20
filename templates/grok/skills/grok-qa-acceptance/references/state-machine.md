# Grok QA State Machine

Owned by agent `grok-qa`. Frontend-oriented full loop:

```text
cases (UI-first) -> ui (core) -> api (narrow smoke) -> review -> gate
```

## Green Statuses

`passed`, `pass`, `green`, `success`

## Retry Budget

- Max **6** sequential stage transitions per user request.
- P0/P1 UI/API cases: up to **2** automated attempts per case (initial + one harness fix/retry) unless user asks full rerun.
- UI batches: prefer **read_only first**, then **mutation** (after seed).
- `manual` / unauthorized `data_mutation` / `destructive`: do not auto-run; report separately.
- Never re-dispatch the same stage without observing artifact or status progress.
- After UI/API status changes: always `update_case_status` + `generate_full_report_html` before Complete.

## Normal Mode

```text
NO_CASES -> CASES
UI_COVERAGE_GAP -> CASES (expand, do not execute yet)
NON_GREEN_UI -> UI
NON_GREEN_API -> API
UNSUPPORTED_P0P1 -> BLOCKED
NEED_REVIEW -> REVIEW
NEED_GATE -> GATE
DONE -> COMPLETED
```

Rules:

1. Missing `test-cases.jsonl` → run **cases**.
2. **UI coverage gate (mandatory before UI execution)** when the task has frontend/page acceptance criteria in `prd.md` (or equivalent):
   - Map PRD page criteria to existing P0/P1 UI cases (`type` in ui|frontend|e2e or `runner` in midscene|playwright).
   - Required theme coverage for a page feature (adapt labels to the product): **entry/structure**, **query/filter**, **create/open form**, **edit path**, **delete/guard**, **key validation**, plus any PRD-named primary actions (settings, status toggle, merge/sort, etc.).
   - Prefer **8–18** focused UI cases for a page feature (`case-schema.md`). Fewer is allowed only when PRD truly has fewer observable behaviors and each is covered.
   - If coverage is thin, placeholder-only, or clearly missing query/create/edit/delete (or other PRD primary paths) → **must run cases expansion first**. Do **not** execute the thin set and claim UI acceptance.
   - Record the coverage check in routing evidence (`phase=cases` or `phase=ui` precheck summary).
3. Any P0/P1 UI/Midscene case not green → run **ui** (only after the coverage gate passes or user explicitly orders “only execute existing cases / 仅执行现有用例”).
4. If there are **no** UI/Midscene P0/P1 cases (backend-only or API-only task) → **skip ui** (do not invent UI).
5. Any P0/P1 API case (`type=api` or `runner` in `api|curl`) not green → run **api**.
6. Any remaining non-UI non-API P0/P1 case not green → **blocked** with unsupported-stage reason. Do not fabricate unit/source/build acceptance.
7. Supported P0/P1 cases green and a Grok acceptance report exists, but no successful Grok review section for that report → run **review**.
8. Successful review present → run **gate**.
9. Gate checked and reported → **completed** (or completed-with-risk if gate fails and user accepts residual risk).

### Trigger wording

| User intent | Behavior |
| --- | --- |
| `开始测试` / `执行验收` / `跑 UI` | Coverage gate → expand if thin → then execute |
| `仅执行现有用例` / `不要重写用例` | Skip expansion; execute as-is; report coverage residual risk |
| `从头开始` / `忽略旧用例` / fresh | Full cases regenerate first (see Fresh Mode) |

## Fresh Mode

Always start with cases:

```text
CASES -> (UI if UI cases) -> (API if API cases) -> REVIEW -> GATE
```

1. Always run **cases** first, even if old cases/reports exist.
2. Cases work must ignore old case status/evidence as generation input.
3. After cases, re-read `test-cases.jsonl`.
4. Run **ui** only if allowed non-green P0/P1 UI cases exist.
5. Run **api** for non-green P0/P1 API cases.
6. If unsupported non-UI/non-API P0/P1 remain → **blocked**.
7. If report exists for this run → **review**, then **gate**.

Fresh mode does not delete historical evidence.

## Stage Selection Helpers

UI case selector:

- `type` in `ui`, `frontend`, `e2e` OR `runner` in `midscene`, `playwright`

API case selector:

- `type=api` OR `runner` in `api`, `curl`

Required priority:

- Gate cares about P0/P1 first.
- P2 may remain pending/deferred with reason.

## Stop Conditions

Stop and return blocked/partial when:

- Task path cannot be resolved
- Risk gate blocks before UI/API
- Env precheck fails for UI and no other runnable stage remains
- Stage produces no required artifact
- Transition budget exhausted
- User authorization required for destructive/mutation cases
- Required project defaults (URL/login) missing after resolution order

## Post-stage hard steps (full run)

After review/gate (and after any UI batch that updates statuses):

1. `python scripts/check_test_cases.py <task>` (skill script if project script missing)
2. `python scripts/generate_full_report_html.py <task>`
3. Final reply leads with full HTML path

Without step 2, do **not** claim Grok QA Complete for a full run.

## Completion Criteria

A run may claim **completed** only when:

1. Required stages for current mode finished or explicitly blocked with reason
2. Full HTML report exists: `test-run-*-grok-full-acceptance.html` covering **all** jsonl cases (not UI-only)
3. Markdown Grok report exists for narrative review/gate
4. Routing evidence jsonl contains entries for executed stages with `dispatchMode=grok-agent` (or documented `grok-skill` fallback)
5. Gate command was run (project or skill `check_test_cases.py`), or explicitly skipped with reason
