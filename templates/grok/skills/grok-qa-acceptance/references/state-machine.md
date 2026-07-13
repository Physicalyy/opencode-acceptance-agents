# Grok QA State Machine

Owned by agent `grok-qa`. Frontend-oriented full loop:

```text
cases (UI-first) -> ui (core) -> api (narrow smoke) -> review -> gate
```

## Green Statuses

`passed`, `pass`, `green`, `success`

## Retry Budget

- Max **6** sequential stage transitions per user request.
- P0/P1 UI/API cases: up to 3 attempts total across the run unless user asks full rerun.
- `manual` / unauthorized `data_mutation` / `destructive`: do not auto-run; report separately.
- Never re-dispatch the same stage without observing artifact or status progress.

## Normal Mode

```text
NO_CASES -> CASES
NON_GREEN_UI -> UI
NON_GREEN_API -> API
UNSUPPORTED_P0P1 -> BLOCKED
NEED_REVIEW -> REVIEW
NEED_GATE -> GATE
DONE -> COMPLETED
```

Rules:

1. Missing `test-cases.jsonl` → run **cases**.
2. Any P0/P1 UI/Midscene case not green → run **ui**.
3. If there are **no** UI/Midscene P0/P1 cases (backend-only or API-only task) → **skip ui** (do not invent UI).
4. Any P0/P1 API case (`type=api` or `runner` in `api|curl`) not green → run **api**.
5. Any remaining non-UI non-API P0/P1 case not green → **blocked** with unsupported-stage reason. Do not fabricate unit/source/build acceptance.
6. Supported P0/P1 cases green and a Grok acceptance report exists, but no successful Grok review section for that report → run **review**.
7. Successful review present → run **gate**.
8. Gate checked and reported → **completed** (or completed-with-risk if gate fails and user accepts residual risk).

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

## Completion Criteria

A run may claim **completed** only when:

1. Required stages for current mode finished or explicitly blocked with reason
2. Grok report path exists for this run attempt
3. Routing evidence jsonl contains entries for executed stages with `dispatchMode=grok-agent` (or documented `grok-skill` fallback)
4. Gate command was run, or explicitly skipped with reason (missing script soft-fail or user instruction recorded)
