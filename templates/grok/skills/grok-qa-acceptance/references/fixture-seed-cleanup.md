# Isolation Fixture Seed / Cleanup

For `risk=data_mutation` UI/API cases on shared environments.

## Defaults (override in `.trellis/acceptance.defaults.md`)

```markdown
## Fixtures
- isolation_date_prefix: 2099-11
- isolation_user_hint: preferred QA account already authorized
- cleanup: soft-delete by date range after UI/API mutation batch
```

## Rules

1. **Seed before** mutation UI that needs list rows (edit/delete/status/merge).
2. Prefer **API seed** (login + create transactions) over manual UI seed when API smoke exists.
3. Use **isolation dates** far in the future (e.g. `2099-11-xx`) so production-like data is untouched.
4. **Cleanup after** the mutation batch (and on abort when possible): soft-delete isolation rows by date range.
5. Record in report:
   - seed counts / date range
   - cleanup counts / status
6. Never leave passwords in seed scripts committed to the repo; use env credentials.

## Suggested flow

```text
prepare run-id
  -> API login
  -> seed N isolation rows
  -> Midscene read_only batch
  -> Midscene mutation batch
  -> cleanup isolation rows
  -> update_case_status from summary
  -> generate_full_report_html
```

## Failure classification

| Situation | failure_class |
| --- | --- |
| seed failed / empty list for data-dependent assert | `data` |
| login/url down | `env` |
| midscene replan / wrong timing | `harness` |
| real business rejection unexpected | `product` |
| intermittent pass on retry | `flake` |
