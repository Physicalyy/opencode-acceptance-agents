# opencode-acceptance-agents

面向 **Trellis** 工程的验收 agents，两条运行时轨：

| 运行时 | 特色 | 流程 |
|--------|------|------|
| **OpenCode** | **多模型分阶段**（DeepSeek / Qwen / GPT） | cases → ui → api → review → gate |
| **Grok** | 单 agent `grok-qa` | cases → ui → api → review → gate |

## OpenCode 多模型矩阵（核心卖点）

| 阶段 | Agent | 默认模型 | 作用 |
|------|--------|----------|------|
| cases | `acceptance-cases` | `opencode-go/deepseek-v4-pro` | UI-first 生成用例，不执行 |
| ui | `acceptance-ui` | `opencode-go/qwen3.6-plus` | Midscene + 多模态执行 |
| api | `acceptance-api` | `opencode-go/deepseek-v4-pro` | 窄 API smoke（支撑前端） |
| review | `acceptance-review` | `openai/gpt-5.5` | 覆盖度 / 证据 / runner 合规 |
| 编排 | `acceptance-agent` | 会话模型 | 分发各阶段，保持各 stage 模型 |

**不要**把四阶段压成一个模型——多模型就是 OpenCode 轨的产品定义。  
能力对齐 HEMS 项目 Trellis 验收实践（状态机、fresh、env precheck、Midscene 强制、API、gate），并去掉 HEMS 业务硬编码。

### 安装后命令

- `/acceptance/auto`、`/acceptance/auto-fresh`
- `/acceptance/cases` | `ui` | `api` | `review`

### 自然语言

「开始测试任务 / 从头开始 / 生成验收用例 / 执行 UI 验收 / 跑 API / 复核报告」→ skill `acceptance-agents` 路由到对应 stage。

## Trellis 约定

- 任务目录：`.trellis/tasks/<task>/`
- 材料：`prd.md` / `design.md` / `implement.md`
- 可选：`.trellis/acceptance.defaults.md`（frontend_url / api_base / 登录方式）
- 门禁（有则跑）：`python ./.trellis/scripts/project/check_test_cases.py <task>`

## 安装

```bash
npx github:Physicalyy/opencode-acceptance-agents --runtime opencode --force --verify --target <项目根>
npx github:Physicalyy/opencode-acceptance-agents --runtime grok --force --verify --target <项目根>
npx github:Physicalyy/opencode-acceptance-agents --detect --target <项目根>
```

AI：**先 detect → 给你选 grok/opencode/all → 再装**，不要甩复制粘贴提示词。见 [AI-INSTALL.md](./AI-INSTALL.md)。

## 与 Grok 隔离

| | OpenCode | Grok |
|--|----------|------|
| 入口 | `acceptance-*` 多模型 | `grok-qa` |
| 报告 | `test-run-*-acceptance.md` | `test-run-*-grok-acceptance.md` |
| 证据 | 任务 evidence（非 grok 前缀） | `grok-qa-routing-*` |

同一次验收不要混跑。

## 模型缺失时

```bash
opencode models
```

改对应 agent frontmatter 的 `model:`，**仍保持分阶段**。
