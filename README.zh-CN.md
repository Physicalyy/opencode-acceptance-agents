# opencode-acceptance-agents

**Trellis 验收 agents** — 一次安装，两条运行时：

- **OpenCode**：多模型分阶段（DeepSeek / Qwen / GPT）——**这是 OpenCode 轨的核心卖点**
- **Grok**：单 agent `grok-qa` 全流程闭环

[English](./README.md) · [AI 安装说明](./AI-INSTALL.md) · [更新日志](./CHANGELOG.md) · [MIT License](./LICENSE)

<p align="left">
  <img alt="version" src="https://img.shields.io/badge/version-0.5.0-blue?style=flat-square" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
  <img alt="node" src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square" />
  <img alt="trellis" src="https://img.shields.io/badge/工程-Trellis-informational?style=flat-square" />
  <img alt="runtimes" src="https://img.shields.io/badge/运行时-OpenCode%20%7C%20Grok-8A2BE2?style=flat-square" />
</p>

---

## 解决什么问题

Trellis 任务验收容易出现：用例无证据、UI 未跑 Midscene、报告里「假绿」。

本仓库安装的是**只做验收、不改业务代码**的 agents，统一约定：

- 读任务材料：`prd.md` / `design.md` / `implement.md`
- 默认 **UI-first + Midscene**
- 产出写在任务目录：`test-cases.jsonl`、中文 `test-run-*.md`、evidence
- OpenCode 与 Grok **双入口互不混跑、不混证据文件名**

```text
                    ┌─────────────────────────────────────┐
                    │           Trellis 任务材料            │
                    │   prd.md · design.md · implement.md  │
                    └─────────────────┬───────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
   ┌─────────────────────┐                         ┌─────────────────────┐
   │      OpenCode       │                         │        Grok         │
   │   多模型分阶段验收    │                         │   单 agent 全流程    │
   │ DeepSeek / Qwen /GPT│                         │      grok-qa        │
   └──────────┬──────────┘                         └──────────┬──────────┘
              │                                               │
              └───────────────────────┬───────────────────────┘
                                      ▼
                    cases → ui → api → review → gate
                    （Grok 另含 coverage-gate · full HTML）
                    test-cases.jsonl · test-run-*.md/.html · evidence/
```

---

## 双运行时一览

| | **OpenCode** | **Grok** |
|--|--------------|----------|
| **定位** | 多模型分阶段 | 单 agent 闭环 |
| **入口** | `acceptance-agent` + 各 stage | `grok-qa` |
| **模型** | DeepSeek → Qwen → DeepSeek → GPT | 当前 Grok 会话模型 |
| **流程** | cases → ui → api → review → gate | coverage-gate → cases → ui → api → review → gate → full HTML |
| **报告** | `test-run-*-acceptance.md` | **主交付** `*-grok-full-acceptance.html` + md 叙事 |
| **证据** | 任务 `evidence/`（OpenCode 约定） | `evidence/grok-qa-routing-*.jsonl` + `midscene-run-grok-*` |
| **安装位置** | 项目 `.opencode/` | `~/.grok/` + 项目 `.grok/` / `.agents/` |

> **同一次验收不要混路径。** OpenCode 会话走 OpenCode；Grok 会话走 `grok-qa`。

---

## OpenCode 多模型矩阵（核心卖点）

| 阶段 | Agent | 默认模型 | 职责 |
|:----:|-------|----------|------|
| **1** | `acceptance-cases` | `opencode-go/deepseek-v4-pro` | 只生成 UI-first 用例，不执行 |
| **2** | `acceptance-ui` | `opencode-go/qwen3.6-plus` | Midscene + 多模态执行 |
| **3** | `acceptance-api` | `opencode-go/deepseek-v4-pro` | 窄 API smoke（支撑前端） |
| **4** | `acceptance-review` | `openai/gpt-5.5` | 覆盖度 / 证据 / runner 合规 |
| **★** | `acceptance-agent` | 会话模型 | 编排各阶段，**保持分模型** |

```text
  [DeepSeek]          [Qwen]           [DeepSeek]         [GPT]
 acceptance-cases → acceptance-ui → acceptance-api → acceptance-review
        │                 │                │                 │
     生成用例           Midscene         curl 冒烟          复核报告
     全部 pending       + 截图证据        + token 脱敏       + soft gate
```

**不要把四阶段压成一个模型。** 缺模型时执行 `opencode models`，只改对应 agent 的 `model:` frontmatter，分阶段结构保留。

能力对齐 HEMS 等 Trellis 工程实践（状态机、fresh、env precheck、Midscene 强制、API、gate），并去掉业务仓库硬编码。

### 安装后命令

| 命令 | 作用 |
|------|------|
| `/acceptance/auto` | 自动编排 / 续跑 |
| `/acceptance/auto-fresh` | 忽略旧用例，全链路重来 |
| `/acceptance/cases` | 仅生成用例（DeepSeek） |
| `/acceptance/ui` | 仅 UI / Midscene（Qwen） |
| `/acceptance/api` | 仅 API smoke（DeepSeek） |
| `/acceptance/review` | 仅复核（GPT） |

### 自然语言触发

「开始测试任务」「从头开始」「生成验收用例」「执行 UI 验收」「跑 API」「复核报告」  
→ skill `acceptance-agents` 路由到对应 stage（主会话不要手写用例或假绿）。

---

## Grok 路径

| 项 | 值 |
|----|-----|
| Agent | `grok-qa`（`1.2.0`） |
| Skill | `grok-qa-acceptance`（含 `scripts/` 流水线） |
| 流程 | coverage-gate → cases → ui → api → review → gate → full HTML |
| Dispatch | `dispatchMode=grok-agent` |
| 路由证据 | `evidence/grok-qa-routing-YYYYMMDD-HHmmss.jsonl` |
| 主报告 | `test-run-*-grok-full-acceptance.html` |
| 装完后 | 新开 Grok 会话，或 `/config-agents` 选 **`grok-qa`** |

---

## 安装

需要 **Node ≥ 18**，目标工程为 **Trellis**（存在 `.trellis/`）。

### 常用命令

```bash
# OpenCode 多模型（OpenCode 用户推荐）
npx github:Physicalyy/opencode-acceptance-agents --runtime opencode --force --verify --target .

# 只装 Grok
npx github:Physicalyy/opencode-acceptance-agents --runtime grok --force --verify --target .

# 两条都装
npx github:Physicalyy/opencode-acceptance-agents --runtime all --force --verify --target .
```

### AI 安装（先识别，再给你选项）

```bash
npx github:Physicalyy/opencode-acceptance-agents --detect --target .
# 你选定 grok | opencode | all 之后：
npx github:Physicalyy/opencode-acceptance-agents --runtime <选择> --force --verify --json --target .
```

人类交互菜单：

```bash
npx github:Physicalyy/opencode-acceptance-agents --interactive --target .
```

| 参数 | 含义 |
|------|------|
| `--runtime opencode\|grok\|all` | 安装哪条轨 |
| `--detect` | 输出 JSON（环境 + 推荐 + 选项） |
| `--yes` | 不询问，直接装推荐 runtime |
| `--verify` | 安装后校验关键文件 |
| `--force` | 覆盖已有 agent/skill |
| `--grok-scope user\|project\|both` | Grok 安装范围（默认 both） |

AI 行为约束见 **[AI-INSTALL.md](./AI-INSTALL.md)**：必须先 detect、向用户展示选项，**禁止**只丢复制粘贴提示词。

### 会写入什么

**OpenCode**

```text
.opencode/agents/acceptance-{agent,cases,ui,api,review}.md
.opencode/skills/acceptance-agents/
.opencode/skills/test-case-generator/
.opencode/commands/acceptance/{auto,auto-fresh,cases,ui,api,review}.md
```

**Grok**

```text
~/.grok/agents/grok-qa.md
~/.grok/skills/grok-qa-acceptance/**
<项目>/.grok/agents/grok-qa.md
<项目>/.agents/skills/grok-qa-acceptance/**
```

OpenCode 装完请 **重启 OpenCode**；Grok 装完请 **新开会话** 或 `/config-agents`。

---

## Trellis 约定

| 项 | 路径 / 规则 |
|----|-------------|
| 任务目录 | `.trellis/tasks/<task-slug>/` |
| 输入 | `prd.md`，可选 `design.md` / `implement.md` |
| 用例 | `test-cases.jsonl` + `test-cases.md` |
| 报告 | OpenCode：`test-run-*-acceptance.md`；Grok：`*-grok-full-acceptance.html` + md 叙事 |
| 环境默认 | `.trellis/acceptance.defaults.md`（`frontend_url` / `api_base` / 登录方式） |
| Soft gate | `python ./.trellis/scripts/project/check_test_cases.py .trellis/tasks/<task>` |

缺少 defaults 时安装器可写 stub；请补真实端口与登录策略，**不要把密码写进仓库**。

---

## 验收纪律（两条轨通用）

| 要做 | 不要做 |
|------|--------|
| 默认 UI-first Midscene 用例 | 无证据标 passed |
| 先 env precheck 再烧 Midscene | `runner=midscene` 用纯 Playwright 冒充通过 |
| API 证据脱敏 token | 把密钥写进任务产物 |
| 只改任务验收产物 | 为了变绿去改业务源码 |
| mutation / destructive 需明确授权 | 未允许就启动前后端服务 |

---

## 装完怎么跑

**OpenCode**

```text
/acceptance/auto-fresh 07-06-your-task-slug
```

或：「`07-06-your-task-slug` 从头开始，忽略旧用例，开始测试任务」

**Grok**

1. `/config-agents` → 选择 `grok-qa`  
2. 「用 Grok 验收 `07-06-your-task-slug`」

---

## 仓库结构

```text
opencode-acceptance-agents/
├── scripts/install.mjs          # detect / install / verify
├── templates/
│   ├── opencode/                # 多模型 agents · skills · commands
│   ├── grok/                    # grok-qa + 合同库
│   └── ai/install-skill/        # AI 安装 skill 模板
├── AI-INSTALL.md
├── AGENTS.md
├── CHANGELOG.md
├── README.md
└── README.zh-CN.md
```

---

## 本地开发

```bash
npm run selfcheck          # 模板完整性
npm run detect             # 探测当前目录
npm run install:opencode   # 安装 OpenCode 轨并 verify
npm run install:grok
npm run dry-run:all
```

---

## License

[MIT](./LICENSE) · 维护者：[Physicalyy](https://github.com/Physicalyy)
