# Evidence Run Layout (single run-id)

One user request that executes Midscene should use **one run-id root**.

## Layout

```text
<task>/evidence/midscene-run-grok-<YYYYMMDD-HHmmss>/
  run-meta.json
  midscene-summary.json          # final/latest summary for this run
  setup-session-login.runtime.yaml  # password redacted
  report/
  output/
  attempts/
    1/                           # optional first attempt artifacts
    2/                           # retry of failed cases only
```

## Rules

1. Create run dir via `scripts/run_midscene_pipeline.py prepare`.
2. Retries of failed cases write under the **same** run-id (`attempts/N` or overwrite summary after merge).
3. Case `evidence` fields point to the **final successful** report when a later attempt passes.
4. Do not scatter peer roots like `midscene-run-grok-retry*` for the same user request unless documenting a separate run; prefer `attempts/`.
5. After status updates, regenerate full HTML so links stay consistent.

## Routing evidence

Still append stages to:

```text
<task>/evidence/grok-qa-routing-YYYYMMDD-HHmmss.jsonl
```

Include `runId` and full HTML path in `artifacts` when available.
