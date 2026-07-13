---
description: Trellis multi-model acceptance auto — orchestrate cases/ui/api/review via acceptance-agent
agent: acceptance-agent
subtask: true
---

Task argument: $ARGUMENTS

You are the OpenCode multi-model acceptance entry. Resolve the Trellis task from `$ARGUMENTS` (slug, path, or current task). Prefer native stage agents with their own models:

- cases → acceptance-cases (DeepSeek)
- ui → acceptance-ui (Qwen)
- api → acceptance-api (DeepSeek)
- review → acceptance-review (GPT)

If `$ARGUMENTS` contains 从头开始 / 重新生成 / fresh / clean / 忽略旧用例 / ignore old cases / regenerate, run **Fresh mode**: cases → ui → api → review → gate, regenerating cases first.
