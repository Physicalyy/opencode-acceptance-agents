# Risk Gate

## Risk Levels

| risk | Default Grok behavior |
|------|------------------------|
| `read_only` | May run |
| `external_cost` | Verify configuration exists; record configured/missing only; never write secret values |
| `data_mutation` | Require isolated fixture data **or** explicit user authorization |
| `destructive` | Require explicit user authorization for the specific case IDs |

## Pre-Execution Scan

Before UI or API execution stages:

1. Load `test-cases.jsonl`
2. Find P0/P1 cases that are not green and have `risk` in `data_mutation|destructive`
3. If any exist and user has not authorized them in this conversation:
   - Do **not** execute those cases
   - Return/include `blocked` for those case IDs with risk labels
   - You may continue with other `read_only` cases

## Authorization Record

When user authorizes mutation/destructive cases, write into report and case `notes`/`evidence`:

- who authorized (user message summary)
- when
- affected scope
- cleanup/rollback expectation if known

## Shared environments

Default to **read-only** checks against shared dev/staging data.

Mark as `destructive` when cases:

- rebuild indexes fully
- delete shared data
- change menus/roles/permissions
- stop shared services

Project-specific DB names and data ownership belong in task docs or `acceptance.defaults.md`, not hard-coded here.

## Never

- Silently downgrade risk to make automation easier
- Run destructive cleanup “to unblock” without asking
- Store passwords or tokens in risk notes
