# opencode-acceptance-agents

给项目安装 **验收测试专用 agents**，支持两种运行时（互不混跑）：

| 运行时 | 入口 | 说明 |
|--------|------|------|
| **OpenCode** | `acceptance-*` | 多 agent + 分阶段多模型 |
| **Grok** | `grok-qa` | 单 agent 全流程：cases → ui → api → review → gate |

## OpenCode 能力

| 阶段 | Agent | 默认模型 | 作用 |
|---|---|---|---|
| 生成 UI 验收用例 | `acceptance-cases` | `opencode-go/deepseek-v4-pro` | 5 步流程生成 `test-cases.jsonl` / `test-cases.md`，不执行 |
| 执行 UI/Midscene | `acceptance-ui` | `opencode-go/qwen3.6-plus` | Midscene、多模态、中文报告 |
| 复核报告 | `acceptance-review` | `opencode/gpt-5.5` | 覆盖度、证据、误报风险 |
| 综合入口 | `acceptance-agent` | 当前会话模型 | 阶段路由 |

### OpenCode Skills

| Skill | 作用 |
|-------|------|
| `acceptance-agents` | 中英文触发词路由，fresh mode（cases→ui→review） |
| `test-case-generator` | 独立 5 步用例生成器 |

## Grok 能力

| 项 | 值 |
|----|-----|
| Agent | `grok-qa` |
| Skill | `grok-qa-acceptance` |
| 流程 | cases → ui → api(窄) → review → gate |
| 证据 | `evidence/grok-qa-routing-*.jsonl`，`dispatchMode=grok-agent` |
| 报告 | `test-run-*-grok-acceptance.md` |

## 安装后 AI 会自动识别吗？

**会自动发现文件，但要装对位置，并新开会话/选 agent。**

| 宿主 | 安装位置 | 识别方式 |
|------|----------|----------|
| **Grok** | 用户：`~/.grok/agents`、`~/.grok/skills`；项目：`.grok/agents`、`.agents/skills` | Grok 扫描这些目录，列表里出现 `grok-qa`。`description` 含验收触发词时，说「开始测试 / 用 Grok 验收」会走 QA。**更稳：`/config-agents` 选 `grok-qa`。** 需新会话或刷新 agents。 |
| **OpenCode** | 项目 `.opencode/agents`、`.opencode/skills` | 重启 OpenCode 后 `opencode agent list` 可见；skill 做自然语言路由 |

**不会**：只装了 OpenCode 轨，却在 Grok 里期望出现 `grok-qa`（或反过来）。  
**不要**：把 Grok 证据前缀和 OpenCode routing 证据混在同一次验收里。

## 安装

### 只装 OpenCode（默认，兼容旧用法）

```bash
npx github:Physicalyy/opencode-acceptance-agents
```

### 只装 Grok

```bash
npx github:Physicalyy/opencode-acceptance-agents --runtime grok
```

或指定项目：

```bash
npx github:Physicalyy/opencode-acceptance-agents --runtime grok --target "D:\path\to\project"
```

安装内容：

```text
~/.grok/agents/grok-qa.md
~/.grok/skills/grok-qa-acceptance/**
<project>/.grok/agents/grok-qa.md
<project>/.agents/skills/grok-qa-acceptance/**
<project>/AGENTS.md   # 追加 Grok 托管块
```

### 两个都装

```bash
npx github:Physicalyy/opencode-acceptance-agents --runtime all --force
```

### 常用参数

| 参数 | 含义 |
|------|------|
| `--detect` | 输出 JSON（AI 用：选项 + 推荐） |
| `--interactive` / `-i` | 人类菜单选择 |
| `--yes` / `-y` | 不询问，直接装推荐 runtime |
| `--runtime opencode\|grok\|all` | 指定轨（TTY 下不写则进交互） |
| `--grok-scope user\|project\|both` | Grok 范围（默认 both） |
| `--verify` | 安装后校验文件 |
| `--selfcheck` | 校验本仓库模板完整性 |
| `--target <dir>` | 项目根目录 |
| `--force` | 覆盖已有文件 |
| `--json` | 输出结果 JSON |
| `--dry-run` | 只打印 |
| `--no-agents-md` | 不改 AGENTS.md |
| `--no-skills` | 不装 skill |

### AI 安装（自动识别 + 给你选项，不要复制提示词）

用户对 AI 说：**「安装验收 agent」** 即可。AI 应：

1. 执行探测：`node scripts/install.mjs --detect --target <项目根>`（输出 JSON）
2. 根据 `choices` / `recommendedRuntime` **向你展示三选一**（Grok / OpenCode / 都装），标出推荐项
3. 你选定后再执行：`node scripts/install.mjs --runtime <id> --target <项目根> [--force]`

**禁止** AI 只甩一段「请复制以下提示词…」。完整 playbook 见 [AI-INSTALL.md](./AI-INSTALL.md)。

人类本机交互安装：

```bash
node scripts/install.mjs --interactive --target <项目根>
```

## 检查是否生效

### Grok

```powershell
Test-Path "$env:USERPROFILE\.grok\agents\grok-qa.md"
Test-Path "$env:USERPROFILE\.grok\skills\grok-qa-acceptance\SKILL.md"
Test-Path ".grok\agents\grok-qa.md"
Test-Path ".agents\skills\grok-qa-acceptance\SKILL.md"
```

然后在 Grok 中 `/config-agents`，应能看到 `grok-qa`。

### OpenCode

```bash
opencode agent list | findstr acceptance
```

应看到：

```text
acceptance-agent
acceptance-cases
acceptance-ui
acceptance-review
```

## 使用方式

### Grok：选 agent 后自然语言

```text
用 Grok 验收 <task-slug>
<task-slug> 从头开始，忽略旧用例，开始测试任务
对当前任务做前端 UI 验收
```

触发词示例：开始测试 / 生成验收用例 / 执行 UI 验收 / Midscene / 复核报告 / 从头开始 / 忽略旧用例。

### OpenCode：只生成 UI 验收用例

```text
调用 acceptance-cases 给当前任务只生成 UI 验收用例，不执行用例。
```

### OpenCode：自然语言触发（skill 自动路由）

- "生成验收用例" → `acceptance-cases`
- "执行 UI 验收" / "跑 Midscene" / "开始测试" → `acceptance-ui`
- "复核报告" → `acceptance-review`
- "从头开始" / "忽略旧用例" → fresh mode：cases → ui → review
- "做完整验收" → `acceptance-agent`

### OpenCode：独立 test-case-generator

```text
使用 test-case-generator，根据以下需求生成测试用例：
<粘贴需求>
```

## 适用项目

- **Trellis**：优先 `.trellis/tasks/<task>/prd.md`、`design.md`、`implement.md`，产出写任务目录；Grok 还可读 `.trellis/acceptance.defaults.md`。
- **非 Trellis（OpenCode）**：需求文档或对话，产出 `acceptance-artifacts/`。

## UI-first 规则（两边通用）

默认只生成用户可见行为相关用例（入口、表单、列表、错误态、权限入口等）。  
默认不生成：编译-only、源码静态检查-only、配置存在性-only、DB 内部实现细节。

## 安全边界

- 不写入密钥、API Key、token。
- 验收模式不修改业务代码。
- `data_mutation` / `destructive` 需明确授权。
- OpenCode 与 Grok 证据文件名前缀不得混用。

## 本地开发

```bash
node scripts/install.mjs --runtime grok --dry-run
node scripts/install.mjs --runtime grok --target /path/to/project
node scripts/install.mjs --runtime all --target /path/to/project --force
```
