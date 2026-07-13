---
name: acceptance-agents
description: Use when the user asks to generate acceptance test cases, UI-first test cases, QA cases, run UI/Midscene acceptance, rerun pending/failed UI cases, or review an acceptance report. Routes work to OpenCode agents acceptance-cases, acceptance-ui, and acceptance-review.
---

# Acceptance Agents

Use this skill to route acceptance-testing requests to the right OpenCode agent.

## Intent Routing

### Generate or refresh cases

Trigger when the user says any of:

- 生成验收用例 / 生成测试用例 / UI 验收用例 / QA 用例 / 测试用例
- test cases / acceptance cases / generate cases
- 只生成，不执行 / 不参考旧 test-run / 不参考旧用例

Route to agent:

```text
acceptance-cases
```

Default behavior:

- Generate UI-first / Midscene-ready cases.
- Do not execute cases.
- Set all new cases to `pending`.
- Do not generate unrelated Maven compile, source inspection, configuration, database-internal, or implementation-detail cases unless the user explicitly asks or the case is strictly necessary to prove a P0/P1 user-visible requirement.

### Execute UI or Midscene acceptance

Trigger when the user says any of:

- 执行 UI 验收 / 跑 Midscene / UI 自动化验收 / 执行 P0/P1 UI 用例 / 开始测试 / 执行验收测试
- rerun failed UI cases / rerun pending UI cases / run acceptance

Route to agent:

```text
acceptance-ui
```

Default behavior:

- Execute selected UI/Midscene cases.
- Collect screenshot, DOM, route, visible-text, console, or network evidence relevant to UI behavior.
- Update only `status`, `evidence`, and `notes` unless the case definition is demonstrably wrong.
- Require explicit authorization for `data_mutation` or `destructive` cases.

### Review acceptance report

Trigger when the user says any of:

- 复核验收报告 / 审查测试报告 / 检查覆盖度 / 看看验收是否充分
- review acceptance report / review report

Route to agent:

```text
acceptance-review
```

Default behavior:

- Review coverage, evidence sufficiency, hidden pending/failed cases, manual-case evidence, and false-positive risk.
- Do not execute cases.
- Do not invent results or evidence.

### Complete acceptance flow

Trigger when the user asks for a broad or full flow, such as:

- 做完整验收 / 跑完整 acceptance / finish acceptance gate / 完整验收流程

Route through:

```text
acceptance-agent
```

The main session may split the work into stages and dispatch `acceptance-cases`, `acceptance-ui`, then `acceptance-review` as needed.

### Fresh / 从头开始

Trigger when the user says any of:

- 从头开始 / 重新生成 / 忽略旧用例 / 忽略旧 test-cases
- fresh / clean / ignore old cases / regenerate / 清空重来

Behavior:

Fresh mode means restarting from cases generation even if `test-cases.jsonl` or previous reports already exist. The stage chain is:

```text
cases → ui → review
```

1. `acceptance-cases`: regenerate cases from scratch, overwrite existing artifacts.
2. `acceptance-ui`: execute all pending P0/P1 UI cases on the fresh set.
3. `acceptance-review`: review the fresh report for coverage and evidence quality.

## Project Modes

### Trellis projects

If `.trellis/` exists:

1. Prefer the active task from the dispatch prompt or `python ./.trellis/scripts/task.py current --source`.
2. Read task artifacts in order: `prd.md`, `design.md` if present, `implement.md` if present.
3. Write acceptance outputs under the task directory.

### Non-Trellis projects

If `.trellis/` does not exist:

1. Use the user-provided requirement document, issue, screenshot, or feature description.
2. If no source is specified, ask for the smallest missing requirement source.
3. Write outputs under `acceptance-artifacts/`.

## Isolation From Grok Path

This skill is **OpenCode-only**.

- Do **not** call or emulate Grok agent `grok-qa` from OpenCode.
- Do **not** write `dispatchMode=grok-agent` or `evidence/grok-qa-routing-*.jsonl`.
- Prefer OpenCode reports such as `test-run-YYYYMMDD-acceptance.md` and OpenCode routing evidence prefixes.
- If the user asks for Grok acceptance, tell them to use Grok / agent `grok-qa` instead of mixing paths.

## Install / reinstall agents

When the user asks to **install or reinstall** acceptance agents:

1. Prefer skill `install-acceptance-agents` if present in the project.
2. Or run the package installer: detect → present choices (`grok` / `opencode` / `all`) → install.
3. Do **not** dump a long copy-paste prompt for the user.

## Safety Rules

- Do not write secrets, API keys, tokens, or environment files.
- Do not modify business code unless the user explicitly changes the request from acceptance to fixing.
- Do not mark cases passed without concrete evidence.
- Keep UI-first case generation focused on user-visible behavior.
