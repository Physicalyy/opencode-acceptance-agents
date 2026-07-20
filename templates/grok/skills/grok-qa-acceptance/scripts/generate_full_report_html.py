#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate full-scope Grok QA HTML report from task test-cases.jsonl.

Usage (from repo root or any cwd):
  python generate_full_report_html.py <task-dir>
  python generate_full_report_html.py .trellis/tasks/07-13-duty-schedule-schema

Outputs (under task dir):
  test-run-YYYYMMDD-grok-full-acceptance.html   # primary user-facing report
  optionally refreshes nothing else

Rules:
  - Full report = ALL cases in test-cases.jsonl (build/api/db/ui/im/...)
  - Never emit UI-only as the primary final HTML for a full acceptance run
  - UI-only HTML is only allowed when user explicitly asks for UI-only stage
"""
from __future__ import annotations

import argparse
import html
import json
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path


def light(status: str | None) -> tuple[str, str]:
    s = (status or "").lower()
    if s in ("passed", "pass", "green", "success"):
        return "green", "通过"
    if s in ("failed", "fail", "red"):
        return "red", "失败"
    if s in ("blocked",):
        return "yellow", "阻塞"
    if s in ("deferred", "pending", "partial"):
        return "yellow", status or "pending"
    return "yellow", status or "pending"


def group_key(c: dict) -> str:
    t = c.get("type") or ""
    a = c.get("area") or ""
    rid = c.get("id") or ""
    runner = c.get("runner") or ""
    if t == "ui" or runner == "midscene" or rid.startswith("TC_UI_"):
        return "UI / Midscene"
    if a == "api" or t == "api" or runner in ("api", "curl"):
        return "API"
    if a == "data" or "DB" in rid:
        return "数据库 / 脚本"
    if a == "backend" or (t in ("unit", "integration") and a == "backend"):
        return "服务端构建 / 单测 / 联调"
    if a == "source" or t == "source":
        return "源码映射"
    if a == "frontend" and t != "ui":
        return "前端构建"
    if a == "integration":
        return "集成 / IM"
    return "其他"


GROUP_ORDER = [
    "UI / Midscene",
    "API",
    "服务端构建 / 单测 / 联调",
    "前端构建",
    "数据库 / 脚本",
    "源码映射",
    "集成 / IM",
    "其他",
]


def evid_html(e: str | None) -> str:
    e = e or ""
    if not e:
        return ""
    if e.endswith(".html") or e.startswith("evidence/") or e.startswith("test-run-"):
        name = Path(e.split("#")[0]).name or e
        return f'<a href="{html.escape(e)}" target="_blank">{html.escape(name)}</a>'
    return html.escape(e)


def load_cases(task_dir: Path) -> list[dict]:
    path = task_dir / "test-cases.jsonl"
    if not path.exists():
        raise SystemExit(f"missing {path}")
    cases = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            cases.append(json.loads(line))
    return cases


def render(task_dir: Path, cases: list[dict], stamp: str | None = None) -> Path:
    stamp = stamp or datetime.now().strftime("%Y%m%d")
    passed = sum(1 for c in cases if light(c.get("status"))[0] == "green")
    failed = sum(1 for c in cases if light(c.get("status"))[0] == "red")
    yellow = len(cases) - passed - failed
    p0 = [c for c in cases if c.get("priority") == "P0"]
    p1 = [c for c in cases if c.get("priority") == "P1"]
    p0_ok = sum(1 for c in p0 if light(c.get("status"))[0] == "green")
    p1_ok = sum(1 for c in p1 if light(c.get("status"))[0] == "green")
    p0_y = len(p0) - p0_ok
    p1_y = len(p1) - p1_ok

    groups: dict[str, list] = defaultdict(list)
    for c in cases:
        groups[group_key(c)].append(c)

    sections = []
    for g in GROUP_ORDER:
        items = groups.get(g) or []
        if not items:
            continue
        rows = []
        for c in items:
            cls, lab = light(c.get("status"))
            rows.append(
                "<tr class='st-{cls}'>"
                "<td><span class='pill {cls}'>{lab}</span></td>"
                "<td><code>{id}</code></td>"
                "<td>{pri}</td>"
                "<td>{typ}</td>"
                "<td>{runner}</td>"
                "<td>{title}</td>"
                "<td>{evid}</td>"
                "</tr>".format(
                    cls=cls,
                    lab=lab,
                    id=html.escape(c.get("id", "")),
                    pri=html.escape(c.get("priority", "")),
                    typ=html.escape(c.get("type", "")),
                    runner=html.escape(c.get("runner", "")),
                    title=html.escape(c.get("title", "")),
                    evid=evid_html(c.get("evidence", "")),
                )
            )
        g_pass = sum(1 for c in items if light(c.get("status"))[0] == "green")
        g_fail = sum(1 for c in items if light(c.get("status"))[0] == "red")
        g_y = len(items) - g_pass - g_fail
        sections.append(
            f"""
<div class="card">
  <h2>{html.escape(g)} <span class="muted">({g_pass} 通 / {g_fail} 败 / {g_y} 黄 · 共 {len(items)})</span></h2>
  <div class="table-wrap">
  <table>
    <thead><tr>
      <th>状态</th><th>ID</th><th>优先级</th><th>类型</th><th>Runner</th><th>标题</th><th>证据</th>
    </tr></thead>
    <tbody>{''.join(rows)}</tbody>
  </table>
  </div>
</div>"""
        )

    if failed:
        decision, banner = "needs-fix", "bad"
    elif yellow:
        decision, banner = "needs-fix", "warn"
    else:
        decision, banner = "pass", "ok"

    task_name = task_dir.name
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    doc = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Grok QA 全量验收 · {html.escape(task_name)}</title>
<style>
:root {{
  --bg:#f4f6f8; --panel:#fff; --text:#1f2933; --muted:#5f6b76; --line:#d9e2ec;
  --green:#0f7b3a; --green-bg:#e3f9ec; --red:#b00020; --red-bg:#fde8ea;
  --yellow:#8a6d00; --yellow-bg:#fff6d6; --blue:#0b6e99;
}}
* {{ box-sizing:border-box; }}
body {{ margin:0; font-family:"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; background:var(--bg); color:var(--text); line-height:1.55; }}
.wrap {{ max-width:1180px; margin:0 auto; padding:24px 16px 56px; }}
.card {{ background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:16px 18px; margin-bottom:14px; box-shadow:0 8px 24px rgba(16,24,40,.05); }}
h1 {{ margin:0 0 8px; font-size:22px; }}
h2 {{ margin:0 0 12px; font-size:17px; }}
.meta {{ color:var(--muted); font-size:13px; display:flex; flex-wrap:wrap; gap:8px 16px; }}
.grid {{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin:14px 0; }}
.stat {{ background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:12px 14px; }}
.stat .n {{ font-size:26px; font-weight:700; line-height:1.1; }}
.stat .l {{ color:var(--muted); font-size:12px; margin-top:4px; }}
.stat.green .n {{ color:var(--green); }} .stat.red .n {{ color:var(--red); }} .stat.yellow .n {{ color:var(--yellow); }}
.pill {{ display:inline-block; border-radius:999px; padding:2px 10px; font-size:12px; font-weight:600; }}
.pill.green {{ background:var(--green-bg); color:var(--green); }}
.pill.red {{ background:var(--red-bg); color:var(--red); }}
.pill.yellow {{ background:var(--yellow-bg); color:var(--yellow); }}
.banner {{ padding:12px 14px; border-radius:0 8px 8px 0; margin-bottom:14px; border-left:4px solid var(--yellow); background:var(--yellow-bg); }}
.banner.ok {{ border-left-color:var(--green); background:var(--green-bg); }}
.banner.bad {{ border-left-color:var(--red); background:var(--red-bg); }}
.banner.warn {{ border-left-color:var(--yellow); background:var(--yellow-bg); }}
table {{ width:100%; border-collapse:collapse; font-size:13px; }}
th, td {{ border-bottom:1px solid var(--line); padding:8px; text-align:left; vertical-align:top; }}
th {{ background:#f8fafc; color:var(--muted); position:sticky; top:0; z-index:1; }}
tr.st-yellow {{ background:#fffdf3; }} tr.st-red {{ background:#fff7f8; }}
.table-wrap {{ overflow:auto; max-height:420px; border:1px solid var(--line); border-radius:8px; }}
.muted {{ color:var(--muted); font-size:13px; font-weight:400; }}
a {{ color:var(--blue); }}
code {{ font-family:Consolas,ui-monospace,monospace; font-size:12px; }}
ul {{ margin:6px 0 0 18px; }}
@media (max-width:800px) {{ .grid {{ grid-template-columns:repeat(2,minmax(0,1fr)); }} }}
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <h1>Grok QA 全量验收报告</h1>
    <div class="meta">
      <span>任务：{html.escape(task_name)}</span>
      <span>Agent：grok-qa</span>
      <span>生成：{now}</span>
      <span>范围：test-cases.jsonl 全量</span>
    </div>
    <p class="muted" style="margin:10px 0 0">
      本文件是<strong>默认最终交付 HTML</strong>（含构建/API/DB/后端/UI/集成等全部分组）。
      UI 专项 HTML 仅在用户明确要求「只跑 UI」时额外生成，不得替代本报告。
    </p>
  </div>

  <div class="banner {banner}">
    <strong>Decision: {decision}</strong>
    — 全量 {passed} 通过 / {failed} 失败 / {yellow} 黄灯 · 共 {len(cases)} 条。
  </div>

  <div class="grid">
    <div class="stat green"><div class="n">{passed}</div><div class="l">通过 (green)</div></div>
    <div class="stat red"><div class="n">{failed}</div><div class="l">失败 (red)</div></div>
    <div class="stat yellow"><div class="n">{yellow}</div><div class="l">阻塞/待办 (yellow)</div></div>
    <div class="stat"><div class="n">{len(cases)}</div><div class="l">用例总数</div></div>
  </div>

  <div class="card">
    <h2>门禁摘要</h2>
    <table>
      <thead><tr><th>范围</th><th>通过</th><th>非绿</th><th>合计</th><th>灯</th></tr></thead>
      <tbody>
        <tr><td>P0</td><td>{p0_ok}</td><td>{p0_y}</td><td>{len(p0)}</td><td>{'🟢' if p0_y == 0 else '🟡'}</td></tr>
        <tr><td>P1</td><td>{p1_ok}</td><td>{p1_y}</td><td>{len(p1)}</td><td>{'🟢' if p1_y == 0 else '🟡'}</td></tr>
        <tr><td>全部</td><td>{passed}</td><td>{failed + yellow}</td><td>{len(cases)}</td><td>{'🟢' if failed == 0 and yellow == 0 else '🟡'}</td></tr>
      </tbody>
    </table>
  </div>

  {''.join(sections)}

  <div class="card">
    <h2>相关文件</h2>
    <ul>
      <li><a href="test-cases.jsonl">test-cases.jsonl</a></li>
      <li><a href="test-cases.md">test-cases.md</a></li>
      <li>Markdown 叙事报告：<code>test-run-{stamp}-grok-acceptance.md</code>（若存在）</li>
    </ul>
  </div>
</div>
</body>
</html>
"""
    out = task_dir / f"test-run-{stamp}-grok-full-acceptance.html"
    out.write_text(doc, encoding="utf-8")
    # also write/overwrite a stable alias for the latest full report
    alias = task_dir / "test-run-latest-grok-full-acceptance.html"
    alias.write_text(doc, encoding="utf-8")
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate full Grok QA HTML report")
    parser.add_argument("task_dir", help="Path to .trellis/tasks/<slug>")
    parser.add_argument("--stamp", default=None, help="YYYYMMDD stamp override")
    args = parser.parse_args(argv)
    task_dir = Path(args.task_dir).resolve()
    cases = load_cases(task_dir)
    out = render(task_dir, cases, args.stamp)
    print(out)
    print(f"cases={len(cases)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
