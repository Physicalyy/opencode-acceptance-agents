# Midscene Patterns (EMCPC / Element UI)

Use with `midscene-limitations.md`. These patterns come from real duty-schedule acceptance failures.

## Credentials

- Source: env `QA_USER` + `QA_PASS` only (or user-provided in conversation).
- **Never** reuse a runtime yaml that already redacted password to `***`.
- After setup, redact password from any generated yaml under `evidence/`.
- Prefer project `generate-setup-yaml.mjs` / session-login setup; do not invent login DOM.

## Session → SPA

After 8083 login, SPA hash route may paint white for several seconds.

Required setup pattern:

1. login on backend login page
2. navigate to SPA hash route
3. sleep ≥ 4–5s
4. re-apply hash if needed
5. `aiWaitFor` business chrome (toolbar/query), not only “not blank”

## Prefer javascript for Element UI

| Control | Prefer | Avoid |
| --- | --- | --- |
| Date range | set page Vue `queryDateRange` / form `dutyDateRange` then query/save | long `aiAct` on picker panels |
| Select | open + click option via JS, or set form field + `$forceUpdate` | multi-step `aiAct` that Replans 20× |
| Table selection | set `selectedRows` then call page method | brittle checkbox clicking only |
| Dialog residue | close all `.el-dialog__wrapper` / message-box at case start | assume clean browser from previous case |

## Async form save (edit)

For edit dialogs that load detail asynchronously:

**Do not** call `save()` until:

- `loading === false`
- `form.ts` present (optimistic lock)
- `form.dutyDate` / business keys present
- `pkUser` / `pkDept` (or task equivalents) present

Poll with short busy-wait or multiple sleep steps. Prefer click visible 保存 after state is ready.

## Assertions

- Prefer **side effects**: dialog closed, list row count/text, page stable.
- Do **not** require toast still visible (transient).
- Empty list: mark `partial`/`blocked` + `failure_class=data` for data-dependent cases; do not fake pass.

## Shared browser context

With `--share-browser-context` / setup:

1. every case starts with dialog cleanup
2. order cases: read_only → mutation
3. mutation cases use isolation dates from fixture contract

## Replan budget

If a step hits `Replanned 20 times`:

- rewrite to JS-assisted flow (harness issue), do not keep burning tokens
- set `failure_class=harness` until rewritten and re-run once
