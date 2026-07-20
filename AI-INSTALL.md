# AI 安装 playbook（给 AI，不是给人复制提示词）

当用户说「安装验收 agent / 安装 QA / 安装 grok-qa / 安装 acceptance agents」时，**按本文件执行**。

## 硬规则

1. **禁止**把长段「请复制以下提示词给 AI…」甩给用户。  
2. **必须先探测**，再**向用户展示选项**，等用户选定后再安装。  
3. 用安装器写文件，不要手搓半份 agent md。  
4. OpenCode 与 Grok **同一次验收不混跑、不混证据前缀**。  
5. 安装后带 `--verify --json`，根据 `verification.ok` 汇报。

## 标准流程（AI）

### Step 1 — 探测

```bash
node scripts/install.mjs --detect --target <project-root>
# 或
npx --yes github:Physicalyy/opencode-acceptance-agents --detect --target <project-root>
```

关键 JSON 字段：

| 字段 | 用途 |
|------|------|
| `packageVersion` | 包版本 |
| `recommendedRuntime` | `grok` \| `opencode` \| `all` |
| `recommendReason` | 推荐理由（可简短转述） |
| `choices` | 必须展示的选项 |
| `installed` | 是否已装 |
| `gaps` | 不完整安装（应提示 `--force`） |
| `installCommands` | 装完后应跑的命令模板 |
| `aiInstructions` | 行为约束（遵守） |

### Step 2 — 给用户选项

| 选项 id | 展示文案 |
|---------|----------|
| `grok` | 只装 Grok（`grok-qa`） |
| `opencode` | 只装 OpenCode（`acceptance-*`） |
| `all` | 两者都装 |

- 标出 `recommended: true`  
- 简述 `recommendReason`  
- `gaps` 非空时询问是否 `--force`  

**禁止**只贴复制粘贴提示词。

### Step 3 — 安装

```bash
node scripts/install.mjs --runtime <id> --target <project-root> [--force] --verify --json
```

用户已说「按推荐装 / 直接装」且不想选：

```bash
node scripts/install.mjs --yes --target <project-root> --verify --json
```

人类交互：

```bash
node scripts/install.mjs --interactive --target <project-root>
```

### Step 4 — 验收结果

- 读 JSON `verification.ok`  
- Grok：新会话或 `/config-agents` → `grok-qa`；skill 应含 `scripts/check_coverage_gate.py` 等流水线脚本  
- OpenCode：重启 OpenCode  
- Trellis + Grok：检查/填写 `.trellis/acceptance.defaults.md`  
- Grok 全流程主交付：`test-run-*-grok-full-acceptance.html`（另有 md 叙事）

## 意图映射

| 用户明确说法 | runtime | 仍需确认？ |
|--------------|---------|------------|
| 只装 Grok / grok-qa | `grok` | 已装则问 `--force` |
| 只装 OpenCode | `opencode` | 同上 |
| 都装 / 全套 | `all` | 同上 |
| 按推荐装 / 直接装 | `--yes` | 可不再问 runtime |
| 安装验收 agent（未指明） | detect → 三选一 | **是** |

## 维护者命令

```bash
npm run selfcheck
npm run detect
npm run install:yes
npm run verify
```
