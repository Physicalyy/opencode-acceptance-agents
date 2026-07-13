---
name: install-acceptance-agents
description: >
  Install OpenCode and/or Grok acceptance QA agents into a project.
  Use when the user asks to 安装验收 agent、安装 QA、安装 grok-qa、安装 acceptance agents、
  install acceptance agents, setup QA agents, or wire up UI acceptance agents.
  Auto-detect environment, present choices (grok / opencode / all), then run the installer.
  Do NOT dump a copy-paste prompt for the user.
---

# Install Acceptance Agents

## Hard rules

1. **Never** give the user a long “copy this prompt to another AI” block.
2. **Always** detect first (unless the user already named a single runtime clearly).
3. **Present choices** and wait for the user pick: `grok` | `opencode` | `all`.
4. Then run the official installer — do not hand-copy partial markdown files.

## Procedure

### 1. Detect

From this package root (or via `npx github:Physicalyy/opencode-acceptance-agents`):

```bash
node scripts/install.mjs --detect --target <project-root>
```

Parse JSON: `recommendedRuntime`, `choices`, `installed`, `recommendReason`.

### 2. Ask the user

Show three options; mark recommended. Example shape:

- Grok only (`grok-qa`)
- OpenCode only (`acceptance-*`)
- Both (`all`)

If anything in `installed` is true, ask whether to overwrite (`--force`).

Skip the menu only when the user already said e.g. “只装 Grok” or “只装 OpenCode”.

### 3. Install

```bash
node scripts/install.mjs --runtime <chosen> --target <project-root> [--force] [--json]
```

Optional: `--grok-scope user|project|both` (default `both`).

### 4. Confirm

Report installed paths and next steps:

- Grok: new session or `/config-agents` → select `grok-qa`
- OpenCode: restart OpenCode

## Isolation

Do not mix OpenCode and Grok evidence prefixes in one acceptance run after install.
