# opencode-acceptance-agents

给 OpenCode 安装一组 **验收测试专用 agents**：默认 UI-first，支持 Trellis 项目和普通项目，按阶段使用不同模型处理不同事情。

## 能力

| 阶段 | Agent | 默认模型 | 作用 |
|---|---|---|---|
| 生成 UI 验收用例 | `acceptance-cases` | `opencode-go/deepseek-v4-pro` | 只生成/刷新 `test-cases.jsonl` 与 `test-cases.md`，不执行 |
| 执行 UI/Midscene 验收 | `acceptance-ui` | `opencode-go/qwen3.6-plus` | 执行 UI 用例、截图/DOM/视觉断言、写报告 |
| 复核验收报告 | `acceptance-review` | `opencode/gpt-5.5` | 检查覆盖度、证据充分性、误报风险 |
| 综合入口 | `acceptance-agent` | 当前会话模型 | 作为阶段路由说明和完整验收入口 |

## 适用项目

- **Trellis 项目**：自动优先读取 `.trellis/tasks/<task>/prd.md`、`design.md`、`implement.md`，输出到任务目录。
- **非 Trellis 项目**：读取用户指定的需求文档或当前对话需求，输出到 `acceptance-artifacts/`。
- 安装器会同时安装一个 OpenCode skill：`acceptance-agents`，用于提示主 AI 自动把“生成验收用例 / UI 验收 / Midscene / 复核报告”等意图路由到对应 agent。

## 安装

在目标项目根目录执行：

```bash
npx github:Physicalyy/opencode-acceptance-agents
```

或者显式指定目标项目：

```bash
npx github:Physicalyy/opencode-acceptance-agents --target /path/to/your/project
```

Windows PowerShell 示例：

```powershell
npx github:Physicalyy/opencode-acceptance-agents --target "D:\idea_project\your-project"
```

安装后会写入：

```text
<project>/.opencode/agents/acceptance-agent.md
<project>/.opencode/agents/acceptance-cases.md
<project>/.opencode/agents/acceptance-ui.md
<project>/.opencode/agents/acceptance-review.md
<project>/.opencode/skills/acceptance-agents/SKILL.md
```

并在 `<project>/AGENTS.md` 中追加一个托管块，告诉 AI 如何自动触发这些 agents。

安装完成后请 **重启 OpenCode**。

## 检查是否生效

```bash
opencode agent list | grep acceptance
```

也可以检查 skill：

```bash
ls .opencode/skills/acceptance-agents/SKILL.md
```

Windows：

```powershell
opencode agent list | findstr acceptance
```

你应该能看到：

```text
acceptance-agent
acceptance-cases
acceptance-ui
acceptance-review
```

## 使用方式

### 只生成 UI 验收用例

```text
调用 acceptance-cases 给当前任务只生成 UI 验收用例，不执行用例。
```

Trellis 指定任务：

```text
调用 acceptance-cases 给 07-06-medrec-search-lucene 生成 UI-first 验收用例，不参考旧 test-run，不执行。
```

非 Trellis 项目：

```text
调用 acceptance-cases，根据 docs/prd.md 生成 UI-first 验收用例，输出到 acceptance-artifacts/，不执行。
```

### 执行 UI/Midscene 验收

```text
调用 acceptance-ui 执行当前任务的 P0/P1 UI 验收用例，写中文 test-run 报告。
```

### 复核验收报告

```text
调用 acceptance-review 复核最新验收报告，检查覆盖度和证据充分性。
```

## UI-first 规则

`acceptance-cases` 默认只生成与用户可见行为直接相关的验收用例，例如：

- 页面入口和导航
- 表单输入与按钮交互
- 搜索、筛选、列表、详情、展开/收起
- 可见文本、错误提示、空状态
- 权限菜单和路由可访问性
- 截图/DOM 可证明的视觉结果

默认不生成无关用例：

- Maven 编译
- 源码静态检查
- 配置存在性检查
- 数据库内部实现检查
- 与用户 UI 验收无直接关系的后端细节

非 UI 用例只有在以下情况才加入：

1. 用户明确要求 API/后端/源码/编译验收；
2. 某个 P0/P1 验收点无法通过 UI 行为证明；
3. 是执行 UI 验收所必需的最小前置冒烟。

## 模型配置

默认模型来自 OpenCode Go / OpenCode：

```yaml
acceptance-cases:  opencode-go/deepseek-v4-pro
acceptance-ui:     opencode-go/qwen3.6-plus
acceptance-review: opencode/gpt-5.5
```

如果你的账号没有这些模型，先查看可用模型：

```bash
opencode models
```

然后修改对应文件的 frontmatter：

```yaml
model: provider/model-id
```

## 安全边界

- 不写入密钥、API Key、token。
- 不修改业务代码。
- 生成用例不执行。
- `data_mutation` / `destructive` 用例需要明确授权和隔离数据。

## 不安装 skill

如果你只想安装 agents，不想安装自动触发提示 skill：

```bash
npx github:Physicalyy/opencode-acceptance-agents --no-skills
```

## 本地开发

克隆后在目标项目测试安装：

```bash
node scripts/install.mjs --target /path/to/project --dry-run
node scripts/install.mjs --target /path/to/project
```

强制覆盖已有 agent：

```bash
node scripts/install.mjs --target /path/to/project --force
```
