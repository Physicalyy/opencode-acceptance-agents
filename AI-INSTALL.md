# AI 安装指南

给 OpenCode 安装 `opencode-acceptance-agents`：一组 UI-first 验收 agents + 自动触发 skill。

## 安装提示

把下面的提示复制并粘贴到你的 AI 智能体（OpenCode、Claude Code、Cursor 等）：

```text
为 OpenCode 安装并配置 opencode-acceptance-agents：
https://raw.githubusercontent.com/Physicalyy/opencode-acceptance-agents/main/README.zh-CN.md

严格按照 README 中的安装步骤执行。
```

## 安装步骤

1. 在目标项目根目录执行：

```bash
npx github:Physicalyy/opencode-acceptance-agents
```

2. 安装完成后重启 OpenCode。

3. 验证：

```bash
opencode agent list | findstr acceptance
```

你应该看到：

```text
acceptance-agent
acceptance-cases
acceptance-review
acceptance-ui
```

## 作用

- `acceptance-cases`：生成 UI-first 验收用例，不执行。
- `acceptance-ui`：执行 UI/Midscene 验收，写报告。
- `acceptance-review`：复核验收报告覆盖度和证据。
- `acceptance-agent`：完整验收入口和阶段路由。

默认安装的 skill 会帮助主 AI 自动识别：

- "生成验收用例" → `acceptance-cases`
- "执行 UI 验收" → `acceptance-ui`
- "复核报告" → `acceptance-review`