# opencode-acceptance-agents

OpenCode acceptance agents for UI-first acceptance case generation, UI/Midscene execution, and report review.

中文文档见 [README.zh-CN.md](./README.zh-CN.md)。

## Capabilities

| Stage | Agent | Default Model | Role |
|---|---|---|---|
| Generate UI cases | `acceptance-cases` | `opencode-go/deepseek-v4-pro` | 5-step workflow (analysis→test points→cases→challenge→coverage) to generate `test-cases.jsonl` and `test-cases.md` |
| Execute UI/Midscene | `acceptance-ui` | `opencode-go/qwen3.6-plus` | Midscene test generation, multimodal review, evidence collection, Chinese reports |
| Review report | `acceptance-review` | `opencode/gpt-5.5` | Coverage, evidence sufficiency, false-positive risk |
| Entry point | `acceptance-agent` | session model | Stage routing and full acceptance flow |

### Skills

| Skill | Role |
|-------|------|
| `acceptance-agents` | Auto-routing from Chinese/English triggers, fresh mode (cases→ui→review) |
| `test-case-generator` | Standalone 5-step test case generator, 8-column markdown + JSONL output |

## Quick Install

```bash
npx github:Physicalyy/opencode-acceptance-agents
```

See [README.zh-CN.md](./README.zh-CN.md) for full documentation, usage examples, and Chinese trigger words.
