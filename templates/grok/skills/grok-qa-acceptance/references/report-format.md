# Grok Acceptance Report Format

## Preferred Paths

Primary user-facing deliverable is **full-scope HTML** (all cases in `test-cases.jsonl`):

```text
.trellis/tasks/<task>/test-run-YYYYMMDD-grok-full-acceptance.html
.trellis/tasks/<task>/test-run-latest-grok-full-acceptance.html   # stable alias, rewritten each run
```

Markdown narrative (still required for review/gate text):

```text
.trellis/tasks/<task>/test-run-YYYYMMDD-grok-acceptance.md
```

Use a distinct `grok` filename so other acceptance products' reports remain separate. You may still update `test-cases.jsonl` status shared by both paths.

## Full HTML is mandatory for full runs

When the run is a normal/full acceptance loop (`开始测试` / `执行验收` / full `cases->ui->api->review->gate`), the agent **must** produce the **full** HTML report covering **every** case in `test-cases.jsonl` (build / api / db / backend / frontend build / ui / integration / …), grouped by area.

| Allowed | Not allowed |
| --- | --- |
| Final handoff points to `*-grok-full-acceptance.html` | Handing only a UI-subset HTML as “the” report after a full run |
| Optional extra `*-grok-ui-acceptance.html` when user asked UI-only | Naming UI-only file without `ui` and presenting it as complete acceptance |
| Regenerate full HTML after any case status update | Leaving full HTML stale while claiming green/red counts |

Generator (preferred):

```bash
python "%USERPROFILE%\.grok\skills\grok-qa-acceptance\scripts\generate_full_report_html.py" .trellis/tasks/<task>
```

If the script is missing, generate the same full HTML shape manually from `test-cases.jsonl` (all lines, all groups). Do not invent case statuses.

### UI-only HTML (secondary)

Only when the user explicitly asks for UI-only stage (`只跑 UI` / `仅 UI 验收`):

```text
.trellis/tasks/<task>/test-run-YYYYMMDD-grok-ui-acceptance.html
```

Still mention residual non-UI cases in the final reply. Never replace the full report requirement for a full run.

## Language

Chinese for narrative sections. Keep IDs, paths, commands, URLs, and status enums in their literal form.

## Required Sections (Markdown)

1. **环境**  
   frontend URL, backend URL, account used (no password), services status, Midscene availability, agent `grok-qa`, dispatch mode `grok-agent`

2. **汇总**  
   必须用红绿灯汇总：🟢 green / 🔴 red / 🟡 yellow 数量；P0/P1 门禁灯号；总评 Decision 带灯  
   并写明全量 HTML 路径（可点击相对链接）

3. **用例表**  
   每行必须有灯号列（🟢/🔴/🟡）+ ID + priority + type/runner + status + 可点击证据链接  
   表头建议：`灯 | ID | 优先级 | 类型 | 状态 | 标题 | 验证证据`  
   **必须覆盖 jsonl 全量**，不得只贴 UI 子集

4. **UI 执行** (if run)  
   env precheck results, Midscene/blocker details

5. **API 执行** (if run)  
   endpoints, status codes, assertion summary (redacted)

6. **发现问题**  
   defects with repro steps and related paths

7. **未执行**  
   skipped/deferred cases and why

8. **Grok Review**  
   `Decision: pass | needs-fix | blocked`  
   coverage / evidence sufficiency / false-pass risks  
   one recommended next action

9. **门禁**  
   `check_test_cases.py` command and outcome, or soft-fail if script missing

## Required shape (Full HTML)

Full HTML must include:

1. Title + task id + agent + generated time  
2. Decision banner (pass / needs-fix / blocked) with green/red/yellow counts for **all** cases  
3. P0/P1 gate table  
4. Grouped tables for every non-empty area (UI, API, backend, frontend build, DB, source, integration, other)  
5. Clickable relative evidence links  
6. Residual risks / blocked cases explicit  

Do not require the user to open Markdown and click Midscene HTML one by one for the overall verdict.

## Evidence Links（强制）

验证证据必须是**可点击 Markdown 超链接**，路径相对任务目录，禁止只写裸路径或仅反引号路径。

每条 UI Midscene 用例至少给两个链接（若文件存在）：

```markdown
[HTML报告](evidence/midscene-run-xxx/report/TC_UI_001-midscene.html) · [output JSON](evidence/midscene-run-xxx/output/TC_UI_001-....json)
```

批次级证据也要可点：

```markdown
[midscene-summary.json](evidence/midscene-run-xxx/midscene-summary.json)
[routing](evidence/grok-qa-routing-YYYYMMDD-HHmmss.jsonl)
```

Do not wrap link targets in backticks.  
表格「验证证据」列禁止只写 `output=xxx.json` 无链接。

## Lights（强制）

报告正文与用例表统一使用 emoji 灯：

| 灯 | 状态 |
| --- | --- |
| 🟢 | `passed` |
| 🔴 | `failed` 或严重不安全行为 |
| 🟡 | `pending` / `blocked` / `deferred` / `partial` |

汇总区、用例表首列、门禁结论、Review Decision 都必须带灯，不能只写英文 status。

## Honesty Rules

- No invented screenshots, HTTP codes, or Midscene conclusions
- No “complete” claim when required Midscene cases were not executed
- Residual risks must be explicit
- In **发现问题**, only list `failure_class=product` (or unknown that looks product). Harness/env/data go to 未执行/环境/用例 harness 说明
- After status changes, regenerate full HTML so counts match jsonl
