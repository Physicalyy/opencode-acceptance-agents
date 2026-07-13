# opencode-acceptance-agents

Trellis 验收 agents：**OpenCode 多模型分阶段** + **Grok 单 agent 全流程**。

## OpenCode（多模型特色）

| 阶段 | Agent | 默认模型 |
|------|--------|----------|
| cases | `acceptance-cases` | `opencode-go/deepseek-v4-pro` |
| ui | `acceptance-ui` | `opencode-go/qwen3.6-plus` |
| api | `acceptance-api` | `opencode-go/deepseek-v4-pro` |
| review | `acceptance-review` | `openai/gpt-5.5` |
| 编排 | `acceptance-agent` | 会话模型分发各 stage |

流程：`cases → ui → api → review → gate`。Fresh：`/acceptance/auto-fresh` 或自然语言「从头开始」。

## Grok

| 项 | 值 |
|----|-----|
| Agent | `grok-qa` |
| Skill | `grok-qa-acceptance` |
| 模板 | `templates/grok/` |

## 安装

```bash
node scripts/install.mjs --detect --target <trellis-project>
node scripts/install.mjs --runtime opencode --target <trellis-project> --force --verify
node scripts/install.mjs --runtime grok --target <trellis-project> --force --verify
```

AI：detect → 选项 → 安装（见 AI-INSTALL.md）。期望目标工程有 `.trellis/`。

<!-- opencode-acceptance-agents:start -->
# OpenCode Acceptance Agents (Trellis multi-model)

OpenCode path uses **different models per stage** (product feature):
- `acceptance-cases` → DeepSeek (`opencode-go/deepseek-v4-pro`)
- `acceptance-ui` → Qwen multimodal (`opencode-go/qwen3.6-plus`)
- `acceptance-api` → DeepSeek (`opencode-go/deepseek-v4-pro`)
- `acceptance-review` → GPT (`openai/gpt-5.5`)
- `acceptance-agent` orchestrates: cases → ui → api → review → gate

Expect **Trellis** (`.trellis/tasks/<task>`). Optional `.trellis/acceptance.defaults.md`.
Commands: `/acceptance/auto`, `/acceptance/auto-fresh`, `/acceptance/cases|ui|api|review`.
Do not mix with Grok `grok-qa` evidence prefixes in one run.

<!-- opencode-acceptance-agents:end -->

<!-- grok-qa-acceptance-agents:start -->
# Grok QA Acceptance Agent

When the user asks to start testing on a Trellis task in Grok, prefer agent `grok-qa`.
Full flow: cases -> ui -> api(narrow) -> review -> gate.
Evidence: `grok-qa-routing-*.jsonl`, `dispatchMode=grok-agent`.
Do not call OpenCode multi-model agents from a pure Grok run.

<!-- grok-qa-acceptance-agents:end -->
