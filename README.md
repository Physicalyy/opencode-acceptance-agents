# opencode-acceptance-agents

Acceptance agents for **Trellis** projects, two runtimes:

| Runtime | Feature | Flow |
|---------|---------|------|
| **OpenCode** | **Multi-model stages** (DeepSeek / Qwen / GPT) | cases → ui → api → review → gate |
| **Grok** | Single agent `grok-qa` | cases → ui → api → review → gate |

中文文档：[README.zh-CN.md](./README.zh-CN.md)

## OpenCode multi-model matrix

| Stage | Agent | Default model | Role |
|-------|--------|---------------|------|
| cases | `acceptance-cases` | `opencode-go/deepseek-v4-pro` | UI-first case generation |
| ui | `acceptance-ui` | `opencode-go/qwen3.6-plus` | Midscene + multimodal |
| api | `acceptance-api` | `opencode-go/deepseek-v4-pro` | Narrow API smoke |
| review | `acceptance-review` | `openai/gpt-5.5` | Coverage + runner compliance |
| orchestrator | `acceptance-agent` | session | Routes stages; keeps per-stage models |

Do **not** collapse stages into one model — that is the OpenCode product identity.

### Commands (after install)

- `/acceptance/auto` — full / continue
- `/acceptance/auto-fresh` — ignore old cases, full chain
- `/acceptance/cases` | `ui` | `api` | `review`

### Skills

- `acceptance-agents` — NL routing to stage agents
- `test-case-generator` — interactive 5-step (prefer `acceptance-cases` for multi-model acceptance)

## Grok

| Item | Value |
|------|-------|
| Agent | `grok-qa` |
| Skill | `grok-qa-acceptance` |
| Evidence | `grok-qa-routing-*.jsonl`, `dispatchMode=grok-agent` |

## Install

```bash
# OpenCode multi-model (Trellis)
npx github:Physicalyy/opencode-acceptance-agents --runtime opencode --force --verify

# Grok
npx github:Physicalyy/opencode-acceptance-agents --runtime grok --force --verify

# Both
npx github:Physicalyy/opencode-acceptance-agents --runtime all --force --verify

# AI: detect → user chooses → install
npx github:Physicalyy/opencode-acceptance-agents --detect --target <project>
```

Expects **`.trellis/`**. Optional: `.trellis/acceptance.defaults.md` for frontend/api URLs.

Playbook for AI installers: [AI-INSTALL.md](./AI-INSTALL.md). Changelog: [CHANGELOG.md](./CHANGELOG.md).
