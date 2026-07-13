---
name: acceptance-agents
description: >
  Trellis multi-model OpenCode acceptance. Use when the user asks to generate acceptance
  cases, run UI/Midscene, run API smoke, review reports, start testing, rerun from scratch,
  ignore old cases, or finish acceptance on a Trellis task. Routes to acceptance-cases
  (DeepSeek), acceptance-ui (Qwen), acceptance-api (DeepSeek), acceptance-review (GPT),
  or acceptance-agent for full orchestration. Do not hand-write tests in the main session.
---

# Acceptance Agents (Trellis / multi-model OpenCode)

Route Trellis acceptance requests to **stage agents with different models**. That multi-model split is the OpenCode product feature.

## Model matrix (do not collapse)

| Intent | Agent | Default model |
|--------|--------|---------------|
| Generate cases | `acceptance-cases` | `opencode-go/deepseek-v4-pro` |
| Execute UI / Midscene | `acceptance-ui` | `opencode-go/qwen3.6-plus` |
| API smoke | `acceptance-api` | `opencode-go/deepseek-v4-pro` |
| Review report | `acceptance-review` | `openai/gpt-5.5` |
| Full / auto / fresh | `acceptance-agent` | session model orchestrates stages |

If models are missing, tell the user to run `opencode models` and edit agent frontmatter — still keep stages separate.

## Trellis only

All target projects use **Trellis**:

1. Resolve task: `Active task` → `.trellis/tasks/<slug>/` → `python ./.trellis/scripts/task.py current --source`
2. Read prd / design / implement under the task
3. Write outputs under the **task directory** only
4. Optional env: `.trellis/acceptance.defaults.md`

If `.trellis/` is missing → blocked (not a non-Trellis fallback product).

## Intent routing

### Generate or refresh cases

Triggers: 生成验收用例 / 生成测试用例 / UI 验收用例 / QA 用例 / test cases / acceptance cases / 只生成不执行

→ **`acceptance-cases`** (DeepSeek)

- UI-first Midscene-ready cases; all `pending`; no execution

### Execute UI / Midscene

Triggers: 执行 UI 验收 / 跑 Midscene / UI 自动化 / 执行 P0/P1 UI / 开始测试 / 执行验收测试 / run acceptance

→ Prefer full orchestrator **`acceptance-agent`** when the user wants a full run; otherwise **`acceptance-ui`** (Qwen) for UI-only.

### API smoke

Triggers: 跑 API / 接口验收 / API smoke

→ **`acceptance-api`** (DeepSeek)

### Review

Triggers: 复核报告 / 审查测试报告 / 检查覆盖度 / review acceptance report

→ **`acceptance-review`** (GPT)

### Complete flow / auto

Triggers: 做完整验收 / 完整验收流程 / finish acceptance / 开始测试任务 (broad)

→ **`acceptance-agent`**

Stages:

```text
cases (deepseek) -> ui (qwen) -> api (deepseek) -> review (gpt) -> gate
```

### Fresh / 从头开始

Triggers: 从头开始 / 重新生成 / fresh / clean / 忽略旧用例 / ignore old cases / regenerate

→ **`acceptance-agent`** with Fresh mode:

```text
cases -> ui -> api -> review -> gate
```

Cases first even if old artifacts exist.

## Main session rules

- Do **not** generate cases, run Midscene, or mark pass/fail in the main session.
- Dispatch stage agents (Task / subagent) so each keeps its model frontmatter.
- Do not mix Grok path: no `grok-qa-routing-*`, no `dispatchMode=grok-agent`.

## Isolation from Grok

| | OpenCode (this) | Grok |
|--|-----------------|------|
| Entry | `acceptance-*` multi-model | `grok-qa` single agent |
| Report | `test-run-*-acceptance.md` | `test-run-*-grok-acceptance.md` |
| Evidence prefix | OpenCode task evidence | `grok-qa-routing-*` |

If user asks for Grok acceptance, tell them to use Grok / `grok-qa`.

## Install / reinstall

Use skill `install-acceptance-agents` or package installer: detect → choices → install. No copy-paste prompt dumps.

## Safety

- No secrets in artifacts
- No product source edits unless user leaves acceptance for fixing
- No service start unless user asks
- No pass without evidence
- Mutation/destructive need explicit authorization
