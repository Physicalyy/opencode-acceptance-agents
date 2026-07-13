# Grok Acceptance Report Format

## Preferred Path

```text
.trellis/tasks/<task>/test-run-YYYYMMDD-grok-acceptance.md
```

Use a distinct `grok` filename so other acceptance products' reports remain separate. You may still update `test-cases.jsonl` status shared by both paths.

## Language

Chinese for narrative sections. Keep IDs, paths, commands, URLs, and status enums in their literal form.

## Required Sections

1. **环境**  
   frontend URL, backend URL, account used (no password), services status, Midscene availability, agent `grok-qa`, dispatch mode `grok-agent`

2. **汇总**  
   必须用红绿灯汇总：🟢 green / 🔴 red / 🟡 yellow 数量；P0/P1 门禁灯号；总评 Decision 带灯

3. **用例表**  
   每行必须有灯号列（🟢/🔴/🟡）+ ID + priority + type/runner + status + 可点击证据链接  
   表头建议：`灯 | ID | 优先级 | 类型 | 状态 | 标题 | 验证证据`

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
