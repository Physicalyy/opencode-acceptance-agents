# opencode-acceptance-agents

本项目提供一组 OpenCode 验收测试专用 agents：默认 UI-first，支持 Trellis 项目和普通项目，按阶段使用不同模型处理不同事情。

## 能力

| 阶段 | Agent | 默认模型 | 作用 |
|---|---|---|---|
| 生成 UI 验收用例 | `acceptance-cases` | `opencode-go/deepseek-v4-pro` | 只生成/刷新 `test-cases.jsonl` 与 `test-cases.md`，不执行 |
| 执行 UI/Midscene 验收 | `acceptance-ui` | `opencode-go/qwen3.6-plus` | 执行 UI 用例、截图/DOM/视觉断言、写报告 |
| 复核验收报告 | `acceptance-review` | `opencode/gpt-5.5` | 检查覆盖度、证据充分性、误报风险 |
| 综合入口 | `acceptance-agent` | 当前会话模型 | 作为阶段路由说明和完整验收入口 |

## 适用项目

- **Trellis 项目**：自动优先读取 `.trellis/tasks/<task>/prd.md`、`design.md`、`implement.md`，输出到任务目录。
- **非 Trellis 项目**：读取用户指定的需求文档或当前对话需求，输出到 `acceptance-artifacts/`。
- 安装器会同时安装一个 OpenCode skill：`acceptance-agents`，用于提示主 AI 自动把“生成验收用例 / UI 验收 / Midscene / 复核报告”等意图路由到对应 agent。

<!-- opencode-acceptance-agents:start -->
# OpenCode Acceptance Agents

When the user asks to generate acceptance cases, prefer the `acceptance-cases` agent.
When generating cases, default to UI-first / Midscene-ready cases and avoid unrelated backend compile, source inspection, configuration, or database-internal cases unless explicitly requested.
When the user asks to execute UI/Midscene acceptance, prefer the `acceptance-ui` agent.
When the user asks to review an acceptance report, prefer the `acceptance-review` agent.
When the project has `.trellis/`, read Trellis task artifacts first; otherwise write acceptance artifacts under `acceptance-artifacts/`.

<!-- opencode-acceptance-agents:end -->