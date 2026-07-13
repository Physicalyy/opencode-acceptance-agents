# opencode-acceptance-agents

本仓库提供验收测试专用 agents，支持 **OpenCode** 与 **Grok** 两条运行时轨（互不混跑）。

## OpenCode

| 阶段 | Agent | 默认模型 | 作用 |
|---|---|---|---|
| 生成 UI 验收用例 | `acceptance-cases` | `opencode-go/deepseek-v4-pro` | 只生成/刷新 `test-cases.jsonl` 与 `test-cases.md`，不执行 |
| 执行 UI/Midscene 验收 | `acceptance-ui` | `opencode-go/qwen3.6-plus` | 执行 UI 用例、截图/DOM/视觉断言、写报告 |
| 复核验收报告 | `acceptance-review` | `opencode/gpt-5.5` | 检查覆盖度、证据充分性、误报风险 |
| 综合入口 | `acceptance-agent` | 当前会话模型 | 阶段路由说明和完整验收入口 |

## Grok

| 项 | 值 |
|----|-----|
| Agent | `grok-qa` |
| Skill | `grok-qa-acceptance` |
| 流程 | cases → ui → api(narrow) → review → gate |
| 模板目录 | `templates/grok/` |

## 适用项目

- **Trellis 项目**：优先读取 `.trellis/tasks/<task>/prd.md`、`design.md`、`implement.md`，输出到任务目录。
- **非 Trellis 项目（OpenCode）**：需求文档或对话，输出到 `acceptance-artifacts/`。
- 安装器可装 OpenCode skill `acceptance-agents` / `test-case-generator`，以及 Grok skill `grok-qa-acceptance`。

## 安装（给维护者 / AI）

**AI 默认流程**（见 [AI-INSTALL.md](./AI-INSTALL.md)）：

1. `node scripts/install.mjs --detect --target <project>` → 读 JSON  
2. 向用户展示 `grok` / `opencode` / `all` 选项（标出 recommended），**不要**丢复制粘贴提示词  
3. 用户选定后：`node scripts/install.mjs --runtime <id> --target <project> [--force]`

人类交互：`node scripts/install.mjs --interactive --target <project>`

直接指定 runtime（用户已说死时）：

```bash
node scripts/install.mjs --runtime opencode --target <project>
node scripts/install.mjs --runtime grok --target <project>
node scripts/install.mjs --runtime all --target <project> --force
```

安装后：OpenCode 需重启；Grok 需新会话或 `/config-agents` 选择 `grok-qa`。

<!-- opencode-acceptance-agents:start -->
# OpenCode Acceptance Agents

When the user asks to generate acceptance cases, prefer the `acceptance-cases` agent.
When generating cases, default to UI-first / Midscene-ready cases and avoid unrelated backend compile, source inspection, configuration, or database-internal cases unless explicitly requested.
When the user asks to execute UI/Midscene acceptance, prefer the `acceptance-ui` agent.
When the user asks to review an acceptance report, prefer the `acceptance-review` agent.
When the project has `.trellis/`, read Trellis task artifacts first; otherwise write acceptance artifacts under `acceptance-artifacts/`.
Do not mix OpenCode acceptance runs with Grok `grok-qa` evidence prefixes in one run.

<!-- opencode-acceptance-agents:end -->

<!-- grok-qa-acceptance-agents:start -->
# Grok QA Acceptance Agent

When the user asks to start testing, run acceptance, generate UI-first cases, run Midscene/UI verification, narrow API smoke, review acceptance reports, or rerun from scratch on a Trellis task, prefer agent `grok-qa`.
Full flow: cases -> ui -> api(narrow) -> review -> gate.
Use skill `grok-qa-acceptance` contracts. Write `dispatchMode=grok-agent` and evidence `evidence/grok-qa-routing-*.jsonl`; prefer report `test-run-*-grok-acceptance.md`.
When the project has `.trellis/`, read task artifacts and optional `.trellis/acceptance.defaults.md` first.
Do not call OpenCode `/local-acceptance/*` or mix OpenCode routing evidence filenames in a Grok run.
After install, open a new Grok session or use `/config-agents` to select `grok-qa`.

<!-- grok-qa-acceptance-agents:end -->
