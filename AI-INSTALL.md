# AI 安装 playbook（给 AI，不是给人复制提示词）

当用户说「安装验收 agent / 安装 QA / 安装 grok-qa / 安装 acceptance agents」时，**按本文件执行**。

## 硬规则

1. **禁止**把长段「请复制以下提示词给 AI…」甩给用户。  
2. **必须先探测**，再**向用户展示选项**，等用户选定后再安装。  
3. 用安装器写文件，不要手搓半份 agent md。  
4. OpenCode 与 Grok **同一次验收不混跑、不混证据前缀**。

## 标准流程（AI）

### Step 1 — 探测

在仓库根或用户指定项目根执行：

```bash
node scripts/install.mjs --detect --target <project-root>
```

若尚未 clone 本仓库，可先 clone / 使用本地路径，或：

```bash
npx --yes github:Physicalyy/opencode-acceptance-agents --detect --target <project-root>
```

（`npx` 需已发布含 `--detect` 的版本；本地开发用 `node scripts/install.mjs`。）

输出为 **JSON**，关键字段：

| 字段 | 用途 |
|------|------|
| `recommendedRuntime` | `grok` \| `opencode` \| `all` |
| `recommendReason` | 推荐理由（可简短转述给用户） |
| `choices` | 必须展示给用户的选项列表 |
| `installed` | 是否已装过（决定是否建议 `--force`） |
| `tools.trellis` | 是否 Trellis 项目 |
| `aiInstructions` | 行为约束（遵守） |

### Step 2 — 给用户选项（不是提示词）

用用户当前客户端支持的方式提问（例如选择题 UI / 编号列表），**选项固定为**：

| 选项 id | 展示文案 |
|---------|----------|
| `grok` | 只装 Grok（`grok-qa` 单 agent 全流程） |
| `opencode` | 只装 OpenCode（`acceptance-*` 多 agent） |
| `all` | 两者都装（验收时仍分路径，不混证据） |

- 把 `choices` 里 `recommended: true` 的标成 **推荐**。  
- 用一句话说明 `recommendReason`。  
- 若 `installed.*` 已有 true，额外问：是否覆盖（`--force`）。

**错误示范**：给用户一段 “请把下面文字复制给另一个 AI…”。  
**正确示范**：

```text
检测到：Grok 环境较明显；推荐装 Grok。

请选择要安装的验收 QA：
1) grok — 只装 Grok（推荐）
2) opencode — 只装 OpenCode
3) all — 两者都装
4) 取消
```

### Step 3 — 安装

用户选定 `id` 后执行（项目根 = detect 的 target）：

```bash
node scripts/install.mjs --runtime <id> --target <project-root> [--force] [--json]
```

Grok 范围默认 `both`（用户级 `~/.grok` + 项目级）。若用户只要全局或只要项目：

```bash
--grok-scope user
--grok-scope project
```

人类本机交互也可：

```bash
node scripts/install.mjs --interactive --target <project-root>
```

### Step 4 — 验收安装结果

- Grok：检查 `~/.grok/agents/grok-qa.md`、项目 `.grok/agents/grok-qa.md`、`.agents/skills/grok-qa-acceptance/SKILL.md`  
- OpenCode：检查 `.opencode/agents/acceptance-*.md`  
- 告知下一步：  
  - Grok → 新会话或 `/config-agents` 选 `grok-qa`  
  - OpenCode → 重启 OpenCode  

## 意图映射（用户已说死时可不问）

| 用户明确说法 | 直接 runtime | 仍需确认？ |
|--------------|--------------|------------|
| 只装 Grok / grok-qa / 用 Grok 验收 agent | `grok` | 若已安装可问是否 `--force` |
| 只装 OpenCode / acceptance-agents | `opencode` | 同上 |
| 都装 / 全套 QA agents | `all` | 同上 |
| 安装验收 agent / 装 QA（未指明） | **先 --detect，再给三选一** | 是 |

## 写入位置（装完宿主如何识别）

| runtime | 路径 | 识别 |
|---------|------|------|
| `opencode` | `<project>/.opencode/agents\|skills` | 重启 OpenCode |
| `grok` | `~/.grok/...` + `<project>/.grok/agents` + `<project>/.agents/skills` | 新 Grok 会话 / `/config-agents` |

## 本仓库维护者

```bash
npm run detect
npm run install:interactive
node scripts/install.mjs --detect --target .
node scripts/install.mjs --interactive --target /path/to/app
```
