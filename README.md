# opencode-acceptance-agents

Acceptance agents for **two runtimes**:

| Runtime | Entry | Role |
|---------|-------|------|
| **OpenCode** | `acceptance-*` agents | Multi-agent, multi-model UI-first acceptance |
| **Grok** | `grok-qa` agent | Single-agent full loop: cases → ui → api → review → gate |

中文文档见 [README.zh-CN.md](./README.zh-CN.md)。

## OpenCode capabilities

| Stage | Agent | Default Model | Role |
|---|---|---|---|
| Generate UI cases | `acceptance-cases` | `opencode-go/deepseek-v4-pro` | 5-step workflow to generate `test-cases.jsonl` / `test-cases.md` |
| Execute UI/Midscene | `acceptance-ui` | `opencode-go/qwen3.6-plus` | Midscene execution, evidence, Chinese reports |
| Review report | `acceptance-review` | `opencode/gpt-5.5` | Coverage, evidence, false-positive risk |
| Entry point | `acceptance-agent` | session model | Stage routing |

### OpenCode skills

| Skill | Role |
|-------|------|
| `acceptance-agents` | Auto-routing from Chinese/English triggers, fresh mode |
| `test-case-generator` | Standalone 5-step case generator |

## Grok capabilities

| Item | Value |
|------|-------|
| Agent | `grok-qa` |
| Skill | `grok-qa-acceptance` |
| Flow | `cases → ui → api(narrow) → review → gate` |
| Evidence | `evidence/grok-qa-routing-*.jsonl`, `dispatchMode=grok-agent` |
| Report | `test-run-*-grok-acceptance.md` |

OpenCode and Grok paths **must not** be mixed in one run (different evidence prefixes and orchestrators).

## Quick install

### OpenCode only (default)

```bash
npx github:Physicalyy/opencode-acceptance-agents
```

### Grok only

```bash
npx github:Physicalyy/opencode-acceptance-agents --runtime grok
```

Installs:

- User-global: `~/.grok/agents/grok-qa.md` + `~/.grok/skills/grok-qa-acceptance/`
- Project: `<target>/.grok/agents/grok-qa.md` + `<target>/.agents/skills/grok-qa-acceptance/`
- Managed block in `<target>/AGENTS.md` (Grok section)

### Both runtimes

```bash
npx github:Physicalyy/opencode-acceptance-agents --runtime all --force
```

### Options

| Flag | Meaning |
|------|---------|
| `--detect` | JSON environment report for AI (choices + recommendation) |
| `--interactive` / `-i` | Human menu after detect |
| `--yes` / `-y` | Install `recommendedRuntime` without a menu |
| `--runtime opencode\|grok\|all` | Explicit path (TTY with no flag → interactive) |
| `--grok-scope user\|project\|both` | Grok scope (default `both`) |
| `--verify` | Post-install file checks |
| `--selfcheck` | Validate package templates |
| `--target <dir>` | Project root (default cwd) |
| `--force` | Overwrite existing files |
| `--dry-run` | Print only |
| `--json` | Emit result JSON |
| `--no-agents-md` | Skip AGENTS.md managed blocks |
| `--no-skills` | Skip skill packages |

## Will AI auto-recognize after install?

**Yes, if files land where the host product scans them.**

| Host | After install | Auto behavior |
|------|---------------|---------------|
| **Grok** | Agent under `~/.grok/agents/` and/or project `.grok/agents/`; skill under `~/.grok/skills/` and/or `.agents/skills/` | Discovers `grok-qa` and `grok-qa-acceptance`. New session or `/config-agents` to select agent. Natural-language triggers in agent/skill `description` also route acceptance intents. |
| **OpenCode** | Agents/skills under project `.opencode/` | Discovers `acceptance-*`; restart OpenCode. Skill `acceptance-agents` routes Chinese/English triggers. |

AI installers should run the `npx` command (or `node scripts/install.mjs`) with the correct `--runtime`, not hand-copy partial files.

## AI install (detect → choices → install)

Tell the AI: **“Install acceptance agents”**. It should:

1. Run `node scripts/install.mjs --detect --target <project-root>` (JSON)
2. Present `choices` (`grok` / `opencode` / `all`) with the recommended option marked
3. After you pick, run `node scripts/install.mjs --runtime <id> --target <project-root> [--force]`

**Do not** dump a copy-paste “prompt for another AI”. Playbook: [AI-INSTALL.md](./AI-INSTALL.md).

Human interactive:

```bash
node scripts/install.mjs --interactive --target <project-root>
```
