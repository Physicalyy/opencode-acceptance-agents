#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Minimal P0/P1 gate checker for Grok QA when project script is missing.

Usage:
  python check_test_cases.py .trellis/tasks/<slug>
  python check_test_cases.py .trellis/tasks/<slug> --json
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

GREEN = {"passed", "pass", "green", "success"}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("task")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)
    task = Path(args.task).resolve()
    path = task / "test-cases.jsonl"
    if not path.exists():
        print(f"missing {path}", file=sys.stderr)
        return 2
    cases = [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]
    p01 = [c for c in cases if c.get("priority") in ("P0", "P1")]
    non_green = [c for c in p01 if (c.get("status") or "").lower() not in GREEN]
    failed = [c for c in p01 if (c.get("status") or "").lower() in ("failed", "fail", "red")]
    blocked = [c for c in non_green if (c.get("status") or "").lower() == "blocked"]
    pending = [c for c in non_green if (c.get("status") or "").lower() in ("pending", "partial", "deferred", "")]

    summary = {
        "total": len(cases),
        "p01": len(p01),
        "p01_green": len(p01) - len(non_green),
        "p01_non_green": len(non_green),
        "failed": [c["id"] for c in failed],
        "blocked": [c["id"] for c in blocked],
        "pending": [c["id"] for c in pending],
        "failure_class": {
            c["id"]: c.get("failure_class")
            for c in non_green
            if c.get("failure_class")
        },
    }

    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    else:
        print(f"total={summary['total']} p01={summary['p01']} green={summary['p01_green']} non_green={summary['p01_non_green']}")
        if failed:
            print("failed:", ", ".join(summary["failed"]))
        if blocked:
            print("blocked:", ", ".join(summary["blocked"]))
        if pending:
            print("pending:", ", ".join(summary["pending"]))
        if summary["failure_class"]:
            print("failure_class:", summary["failure_class"])

    # exit 1 if any failed product issues; exit 2 if any non-green P0/P1
    if failed:
        return 1
    if non_green:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
