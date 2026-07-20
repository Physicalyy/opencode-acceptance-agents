#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Documented Midscene pipeline helper for Grok QA.

This script standardizes run-id layout and post-processing. It does not invent
credentials. On Windows, actual Midscene CLI is usually invoked by the agent
with project setup scripts; this helper:

1. Creates evidence/midscene-run-grok-<runId>/
2. Writes run-meta.json
3. Optionally applies midscene-summary.json back to test-cases.jsonl
4. Regenerates full HTML report

Usage:
  # prepare run dir
  python run_midscene_pipeline.py prepare --task .trellis/tasks/<slug> --run-id 20260717-180000

  # after midscene finished:
  python run_midscene_pipeline.py finalize --task ... --run-dir evidence/midscene-run-grok-...
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parents[1]


def prepare(task: Path, run_id: str | None) -> Path:
    run_id = run_id or datetime.now().strftime("%Y%m%d-%H%M%S")
    run_dir = task / "evidence" / f"midscene-run-grok-{run_id}"
    run_dir.mkdir(parents=True, exist_ok=True)
    (run_dir / "attempts").mkdir(exist_ok=True)
    meta = {
        "runId": run_id,
        "task": str(task),
        "createdAt": datetime.now().isoformat(timespec="seconds"),
        "agent": "grok-qa",
        "layout": {
            "summary": "midscene-summary.json",
            "report": "report/",
            "output": "output/",
            "attempts": "attempts/",
        },
        "rules": [
            "Do not reuse redacted setup yaml as password source",
            "Prefer generate-setup-yaml + QA_USER/QA_PASS env",
            "Write all attempts under this runId",
            "finalize after midscene to update jsonl + full HTML",
        ],
    }
    (run_dir / "run-meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(run_dir)
    return run_dir


def finalize(task: Path, run_dir: Path) -> int:
    summary = run_dir / "midscene-summary.json"
    if not summary.exists():
        print(f"missing summary: {summary}", file=sys.stderr)
        return 2
    upd = SKILL_DIR / "scripts" / "update_case_status.py"
    html = SKILL_DIR / "scripts" / "generate_full_report_html.py"
    r1 = subprocess.run(
        [
            sys.executable,
            str(upd),
            "--task",
            str(task),
            "--from-midscene-summary",
            str(summary),
            "--run-dir",
            str(run_dir),
        ],
        check=False,
    )
    r2 = subprocess.run(
        [sys.executable, str(html), str(task)],
        check=False,
    )
    print(f"update_case_status_exit={r1.returncode}")
    print(f"generate_full_report_html_exit={r2.returncode}")
    return 0 if r1.returncode == 0 and r2.returncode == 0 else 1


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    p1 = sub.add_parser("prepare")
    p1.add_argument("--task", required=True)
    p1.add_argument("--run-id", default=None)

    p2 = sub.add_parser("finalize")
    p2.add_argument("--task", required=True)
    p2.add_argument("--run-dir", required=True)

    args = ap.parse_args(argv)
    task = Path(args.task).resolve()
    if args.cmd == "prepare":
        prepare(task, args.run_id)
        return 0
    return finalize(task, Path(args.run_dir).resolve())


if __name__ == "__main__":
    raise SystemExit(main())
