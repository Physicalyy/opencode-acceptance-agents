# Failure Class

Optional but recommended field on cases after execution:

```json
"failure_class": "product|harness|env|data|flake"
```

| Class | Meaning | Report treatment |
| --- | --- | --- |
| `product` | Real product behavior contradicts expected | List under 发现问题 |
| `harness` | Automation timing/selectors/replan/script error | Not a product defect; fix YAML/pipeline and re-run |
| `env` | Service down, login broken, missing Midscene key | blocked / env section |
| `data` | Missing fixture rows / wrong isolation data | seed or mark partial |
| `flake` | Passed on retry without product change | note flake risk |

## Rules

- Do not mark harness/env/data failures as product bugs in Review.
- `update_case_status.py --from-midscene-summary` sets a best-effort class; agent may override with better judgment.
- Gate still cares about non-green P0/P1; classify for humans and next action.
