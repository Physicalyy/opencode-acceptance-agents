# opencode-acceptance-agents

**Trellis UI acceptance agents** — install once, run full verification with either **OpenCode multi-model stages** or a **Grok single-agent loop**.

[中文文档](./README.zh-CN.md) · [AI install playbook](./AI-INSTALL.md) · [Changelog](./CHANGELOG.md) · [License: MIT](./LICENSE)

<p align="left">
  <img alt="version" src="https://img.shields.io/badge/version-0.5.0-blue?style=flat-square" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
  <img alt="node" src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square" />
  <img alt="trellis" src="https://img.shields.io/badge/project-Trellis-informational?style=flat-square" />
  <img alt="runtimes" src="https://img.shields.io/badge/runtimes-OpenCode%20%7C%20Grok-8A2BE2?style=flat-square" />
</p>

---

## Why this exists

Manual acceptance for Trellis tasks is slow and easy to fake: cases without evidence, UI checks without Midscene, reports that invent green lights.

This package installs **acceptance-only agents** that:

- Read Trellis task materials (`prd` / `design` / `implement`)
- Prefer **UI-first** Midscene cases
- Produce **JSONL + Chinese reports** under the task directory
- Keep **OpenCode multi-model** and **Grok single-agent** as **two separate products** (never mix evidence in one run)

```text
                    ┌─────────────────────────────────────┐
                    │         Trellis task artifacts       │
                    │   prd.md · design.md · implement.md  │
                    └─────────────────┬───────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
   ┌─────────────────────┐                         ┌─────────────────────┐
   │      OpenCode       │                         │        Grok         │
   │  multi-model stages │                         │   single agent      │
   │ DeepSeek / Qwen /GPT│                         │      grok-qa        │
   └──────────┬──────────┘                         └──────────┬──────────┘
              │                                               │
              └───────────────────────┬───────────────────────┘
                                      ▼
                    cases → ui → api → review → gate
                    (+ Grok: coverage-gate · full HTML)
                    test-cases.jsonl · test-run-*.md/.html · evidence/
```

---

## Two runtimes

| | **OpenCode** | **Grok** |
|--|--------------|----------|
| **Identity** | Multi-model staged acceptance | One agent full loop |
| **Entry** | `acceptance-agent` + stage agents | `grok-qa` |
| **Models** | DeepSeek → Qwen → DeepSeek → GPT | Current Grok model |
| **Flow** | cases → ui → api → review → gate | coverage-gate → cases → ui → api → review → gate → full HTML |
| **Report** | `test-run-*-acceptance.md` | **Primary** `*-grok-full-acceptance.html` + md narrative |
| **Evidence** | Task `evidence/` (OpenCode prefixes) | `evidence/grok-qa-routing-*.jsonl` + `midscene-run-grok-*` |
| **Install** | Project `.opencode/` | `~/.grok/` + project `.grok/` / `.agents/` |

> **Do not merge paths.** If you use OpenCode, stay on OpenCode evidence. If you use Grok, stay on `grok-qa` prefixes.

---

## OpenCode multi-model matrix

This is the **product feature** of the OpenCode path — keep stages on different models.

| Stage | Agent | Default model | Responsibility |
|:-----:|-------|---------------|----------------|
| **1** | `acceptance-cases` | `opencode-go/deepseek-v4-pro` | UI-first case generation (no execution) |
| **2** | `acceptance-ui` | `opencode-go/qwen3.6-plus` | Midscene + multimodal UI execution |
| **3** | `acceptance-api` | `opencode-go/deepseek-v4-pro` | Narrow API smoke for the frontend |
| **4** | `acceptance-review` | `openai/gpt-5.5` | Coverage, evidence, runner compliance |
| **★** | `acceptance-agent` | session model | Orchestrates stages; preserves per-stage models |

```text
  [DeepSeek]          [Qwen]           [DeepSeek]         [GPT]
 acceptance-cases → acceptance-ui → acceptance-api → acceptance-review
        │                 │                │                 │
     generate          Midscene         curl smoke         review
     cases only        + screenshots    + token redact     + soft gate
```

**Never collapse all stages into one model.** If a default model is missing, run `opencode models` and edit that agent’s `model:` frontmatter — still keep the split.

### Commands (after install)

| Command | Purpose |
|---------|---------|
| `/acceptance/auto` | Continue / full orchestration |
| `/acceptance/auto-fresh` | Ignore old cases; full chain from scratch |
| `/acceptance/cases` | Generate cases only (DeepSeek) |
| `/acceptance/ui` | UI / Midscene only (Qwen) |
| `/acceptance/api` | API smoke only (DeepSeek) |
| `/acceptance/review` | Report review only (GPT) |

### Natural language

Phrases like *开始测试任务*, *从头开始*, *生成验收用例*, *执行 UI 验收*, *跑 API*, *复核报告* are routed by skill `acceptance-agents` to the correct stage.

---

## Grok path

| Piece | Value |
|-------|--------|
| Agent | `grok-qa` (`1.2.0`) |
| Skill | `grok-qa-acceptance` (+ `scripts/` pipeline helpers) |
| Flow | coverage-gate → cases → ui → api → review → gate → full HTML |
| Dispatch | `dispatchMode=grok-agent` |
| Routing evidence | `evidence/grok-qa-routing-YYYYMMDD-HHmmss.jsonl` |
| Primary report | `test-run-*-grok-full-acceptance.html` |
| After install | New Grok session or `/config-agents` → select **`grok-qa`** |

---

## Install

Requires **Node ≥ 18** and a **Trellis** project (`.trellis/`).

### One-liners

```bash
# OpenCode multi-model (recommended for OpenCode users)
npx github:Physicalyy/opencode-acceptance-agents --runtime opencode --force --verify --target .

# Grok only
npx github:Physicalyy/opencode-acceptance-agents --runtime grok --force --verify --target .

# Both runtimes
npx github:Physicalyy/opencode-acceptance-agents --runtime all --force --verify --target .
```

### AI-friendly install (detect → choose → install)

```bash
npx github:Physicalyy/opencode-acceptance-agents --detect --target .
# then after the user picks grok | opencode | all:
npx github:Physicalyy/opencode-acceptance-agents --runtime <choice> --force --verify --json --target .
```

Human interactive menu:

```bash
npx github:Physicalyy/opencode-acceptance-agents --interactive --target .
```

| Flag | Meaning |
|------|---------|
| `--runtime opencode\|grok\|all` | Which product path to install |
| `--detect` | JSON environment report for AI agents |
| `--yes` | Install recommended runtime without a menu |
| `--verify` | Check that critical files landed |
| `--force` | Overwrite existing agents/skills |
| `--grok-scope user\|project\|both` | Grok install scope (default `both`) |

Full AI behavior rules: **[AI-INSTALL.md](./AI-INSTALL.md)** (detect first, present choices — no copy-paste prompt dumps).

### What gets installed

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
.project/.grok/agents/grok-qa.md
.project/.agents/skills/grok-qa-acceptance/**
```

Restart **OpenCode** after OpenCode install. Open a **new Grok session** (or `/config-agents`) after Grok install.

---

## Trellis conventions

| Item | Path / rule |
|------|-------------|
| Task root | `.trellis/tasks/<task-slug>/` |
| Inputs | `prd.md`, optional `design.md` / `implement.md` |
| Cases | `test-cases.jsonl` + `test-cases.md` |
| Report | OpenCode: `test-run-*-acceptance.md`; Grok: `*-grok-full-acceptance.html` + md narrative |
| Env defaults | `.trellis/acceptance.defaults.md` (`frontend_url`, `api_base`, login mode) |
| Soft gate | `python ./.trellis/scripts/project/check_test_cases.py .trellis/tasks/<task>` |

Installer can create a stub `acceptance.defaults.md` when missing. Fill real ports and login policy there — **never commit passwords**.

---

## Acceptance rules (both paths)

| Do | Don't |
|----|--------|
| UI-first Midscene cases by default | Invent green results without evidence |
| Env precheck before burning Midscene time | Mark `runner=midscene` passed with Playwright-only checks |
| Redact tokens in API evidence | Write secrets into task files |
| Edit only task acceptance artifacts | Change product source to force green |
| Authorize mutation / destructive cases | Start backend/frontend services unless the user asks |

---

## Quick start (after install)

**OpenCode**

```text
/acceptance/auto-fresh 07-06-your-task-slug
```

or: *「07-06-your-task-slug 从头开始，忽略旧用例，开始测试任务」*

**Grok**

1. `/config-agents` → select `grok-qa`  
2. *「用 Grok 验收 07-06-your-task-slug」*

---

## Project layout

```text
opencode-acceptance-agents/
├── scripts/install.mjs          # detect / install / verify
├── templates/
│   ├── opencode/                # multi-model agents, skills, commands
│   ├── grok/                    # grok-qa + contract library
│   └── ai/install-skill/        # AI install skill template
├── AI-INSTALL.md
├── AGENTS.md
├── CHANGELOG.md
├── README.md
└── README.zh-CN.md
```

---

## Development

```bash
npm run selfcheck          # package template health
npm run detect             # detect against cwd
npm run install:opencode   # install OpenCode path with verify
npm run install:grok
npm run dry-run:all
```

---

## License

[MIT](./LICENSE) · Maintainer: [Physicalyy](https://github.com/Physicalyy)
