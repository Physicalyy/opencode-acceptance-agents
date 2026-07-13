---
name: test-case-generator
description: >-
  按 5 步流程（需求分析 → 测试点提取 → 用例细化 → 反向挑刺 → 覆盖度自评）
  将产品/技术需求拆解为标准测试用例表，输出 markdown 表格可直接粘贴
  Excel/飞书多维表格/Numbers。触发条件：用户提供需求文档或任务 prd/design/implement，
  要求生成测试用例、测试点、QA 用例、用例评审、测试覆盖时触发。
---

# test-case-generator

基于开源 `test-case-skill` 的方法论，适配通用软件项目场景。

## 触发条件

- 用户要求"生成测试用例 / 测试点 / 用例评审"。
- 用户提供了需求文本或接口/页面描述，要求拆解 QA 用例。
- Trellis 项目任务完成 `prd.md` / `design.md` / `implement.md` 后，用户要求生成测试验收产物。

## 全局约束

- 回复语言：中文。
- 每步必须暂停等待用户确认，禁止一次性输出全部步骤。
- 测试点必须含具体数据，预期必须可验证。
- 不脑补需求外业务，疑点放歧义清单。
- 最终用例以 markdown 表格输出，8 列固定格式。

## 输出格式

### test-cases.md（给人阅读）

```markdown
| 用例编号 | 所属模块 | 优先级 | 用例标题 | 前置条件 | 测试数据 | 测试步骤 | 预期结果 |
|----------|----------|--------|----------|----------|----------|----------|----------|
| TC_001   | 功能 1   | P0     | ...      | ...      | ...      | ...      | ...      |
```

### test-cases.jsonl（给脚本/自动化）

每行一个 JSON 对象：

```json
{"id":"TC_001","title":"...","priority":"P0","area":"frontend","type":"ui","runner":"midscene","risk":"read_only","verification":"auto","preconditions":["..."],"test_data":["..."],"steps":["..."],"expected":["..."],"status":"pending","evidence":"","notes":""}
```

字段说明：

| 字段 | 可选值 |
|------|--------|
| `priority` | `P0`, `P1`, `P2` |
| `area` | `frontend`, `api`, `integration`, `data`, `security`, `source`, `manual` |
| `type` | `ui`, `api`, `integration`, `source`, `manual`, `smoke` |
| `runner` | `midscene`, `curl`, `maven`, `pnpm`, `npm`, `shell`, `manual` |
| `risk` | `read_only`, `data_mutation`, `destructive`, `external_cost` |
| `verification` | `manual`, `auto` |
| `status` | `pending`, `passed`, `failed`, `blocked`, `deferred`, `skipped` |

## 5 步流程

### 步骤 1：需求分析
- 提取显式功能点（3-7 条，颗粒度对应 5-15 条测试用例）。
- 列出隐含约束、依赖边界、TOP3 风险点。
- 歧义清单 ≥3 条（markdown 表格：需确认 / 可能方向 / 为什么重要）。
- 识别测试对象（UI 元素、数据字段、业务动作）。
- 对文字输入/图片上传/URL 输入类对象追加内容安全标注。

### 步骤 2：测试点提取
- 沿 9 维度展开：业务规则 / 数据类型 / 长度边界 / 格式 / 状态 / 交互 / 时序 / 环境 / 角色。
- 按测试对象分组，每对象覆盖 ≥3 维度，核心对象 ≥6 维度。
- 测试点含具体数据，不写抽象项。

### 步骤 3：用例细化
- 输出 8 列 markdown 表格，按"所属模块"分组。
- 用例编号格式 `TC_{缩写}_{序号}`。
- 前置条件/测试数据/测试步骤/预期结果均为 QA 可执行的具体值。

### 步骤 4：反向挑刺
- 从遗漏/冗余/不可执行/优先级偏差/致命盲点 5 个角度审查。
- 用具体用例编号指出问题，不写套话。

### 步骤 5：覆盖度自评
- 输出功能覆盖矩阵、缺口分析、主动放弃声明。
- 最后一行总结"能发现/不能发现什么类 bug"。

## 项目模式（Trellis 优先）

本开源验收产品面向 **Trellis 工程**：

1. 优先使用 dispatch prompt 中的 `Active task`，或 `python ./.trellis/scripts/task.py current --source`。
2. 读取任务材料：`prd.md`、`design.md`（如有）、`implement.md`（如有）。
3. 输出到 `.trellis/tasks/<task>/` 下的 `test-cases.jsonl` / `test-cases.md`。

若用户明确要求「交互式 5 步拆解」且未要求走验收 agent，可用本 skill；若用户要 **OpenCode 多模型验收用例生成**，应路由到 `acceptance-cases`（DeepSeek），不要在主会话手写用例。

若工程没有 `.trellis/`：说明本产品默认假设 Trellis；仅当用户坚持时，才可输出到 `acceptance-artifacts/` 并注明非标准模式。
