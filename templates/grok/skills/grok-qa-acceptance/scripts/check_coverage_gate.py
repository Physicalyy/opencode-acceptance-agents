#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Weak PRD/UI coverage gate for Grok QA.

Exits 0 if coverage OK or --soft; exits 2 if thin suite / missing themes.

Usage:
  python check_coverage_gate.py --task .trellis/tasks/<slug>
  python check_coverage_gate.py --task ... --soft
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

THEMES = {
    "entry": ["结构", "页面", "入口", "工具栏", "列表列", "可见", "打开页面", "page", "structure", "toolbar"],
    "query": ["查询", "筛选", "条件", "重置", "分页", "query", "filter", "search"],
    "create": ["新增", "创建", "保存", "insert", "create", "add"],
    "edit": ["修改", "编辑", "edit", "update"],
    "delete": ["删除", "软删", "delete", "remove"],
    "validate": ["校验", "拒绝", "只读", "拦截", "提示", "validate", "reject", "guard", "readonly"],
}


def load_cases(task: Path) -> list[dict]:
    path = task / "test-cases.jsonl"
    if not path.exists():
        raise SystemExit(f"missing {path}")
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]


def is_ui(c: dict) -> bool:
    return (
        c.get("type") in ("ui", "frontend", "e2e")
        or c.get("runner") in ("midscene", "playwright")
        or str(c.get("id", "")).startswith("TC_UI_")
    )


def text_of(c: dict) -> str:
    parts = [
        c.get("id") or "",
        c.get("title") or "",
        " ".join(c.get("steps") or []),
        " ".join(c.get("expected") or []),
        c.get("notes") or "",
    ]
    return " ".join(parts).lower()


def detect_themes(cases: list[dict]) -> set[str]:
    found = set()
    for c in cases:
        blob = text_of(c)
        for theme, kws in THEMES.items():
            if any(k.lower() in blob for k in kws):
                found.add(theme)
    return found


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--task", required=True)
    ap.add_argument("--soft", action="store_true", help="Always exit 0; print gaps only")
    ap.add_argument("--min-ui", type=int, default=6, help="Minimum UI cases for a page feature")
    args = ap.parse_args(argv)

    task = Path(args.task).resolve()
    cases = load_cases(task)
    ui = [c for c in cases if is_ui(c)]
    # If no UI cases at all, coverage gate is N/A (backend-only)
    if not ui:
        print("coverage_gate=skip reason=no-ui-cases")
        return 0

    themes = detect_themes(ui)
    required = {"entry", "query", "create", "edit", "delete", "validate"}
    missing = sorted(required - themes)
    thin = len(ui) < args.min_ui

    # placeholder smell: only smoke open/guard
    titles = " ".join((c.get("title") or "") for c in ui)
    placeholder = len(ui) <= 3 and not missing == []  # noqa: SIM201 — keep explicit
    if len(ui) <= 3:
        placeholder = True

    print(f"ui_cases={len(ui)}")
    print(f"themes={','.join(sorted(themes)) or '(none)'}")
    print(f"missing={','.join(missing) or '(none)'}")
    print(f"thin={thin} placeholder={placeholder}")

    bad = bool(missing) or thin or placeholder
    if bad:
        print("coverage_gate=FAIL")
        print("action=expand-cases-before-ui-execution")
        return 0 if args.soft else 2

    print("coverage_gate=PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
