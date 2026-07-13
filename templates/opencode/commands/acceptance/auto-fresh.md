---
description: Trellis multi-model acceptance fresh run — ignore old cases, full stage chain
agent: acceptance-agent
subtask: true
---

Task argument: $ARGUMENTS

**Fresh mode: true**

Ignore old test-cases / Midscene drafts / reports as generation input. Force:

```text
cases (DeepSeek) -> ui (Qwen) -> api (DeepSeek) -> review (GPT) -> gate
```

Always regenerate cases first from prd/design/implement only. Then execute UI and API stages as needed, review, and soft gate.
