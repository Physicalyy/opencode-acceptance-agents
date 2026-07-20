#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Safely update status/evidence/notes/failure_class on test-cases.jsonl lines.

Never hand-edit multi-line JSONL via shell string joins.

Usage:
  python update_case_status.py --task .trellis/tasks/<slug> --id TC_UI_015 --status passed --evidence evidence/.../x.html
  python update_case_status.py --task ... --from-midscene-summary evidence/run/midscene-summary.json --run-dir evidence/run
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


def load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        raise SystemExit(f"missing {path}")
    cases = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            cases.append(json.loads(line))
    return cases


def write_jsonl(path: Path, cases: list[dict]) -> None:
    path.write_text(
        "\n".join(json.dumps(c, ensure_ascii=False, separators=(",", ":")) for c in cases) + "\n",
        encoding="utf-8",
    )


def case_id_from_script(script: str) -> str | None:
    name = Path(str(script).replace("\\", "/")).name
    m = re.search(r"(TC_[A-Z0-9_]+)", name)
    return m.group(1) if m else None


def apply_one(
    cases: list[dict],
    case_id: str,
    status: str | None,
    evidence: str | None,
    notes: str | None,
    failure_class: str | None,
) -> bool:
    for c in cases:
        if c.get("id") != case_id:
            continue
        if status is not None:
            c["status"] = status
        if evidence is not None:
            c["evidence"] = evidence
        if failure_class is not None:
            c["failure_class"] = failure_class
        if notes:
            prev = c.get("notes") or ""
            if notes not in prev:
                c["notes"] = (prev + "; " + notes).strip("; ")
        return True
    return False


def from_midscene_summary(summary_path: Path, run_dir: Path | None) -> list[tuple[str, str, str, str | None]]:
    """Return list of (id, status, evidence, failure_class)."""
    data = json.loads(summary_path.read_text(encoding="utf-8"))
    results = data.get("results") or []
    run_dir = run_dir or summary_path.parent
    # evidence paths relative to task dir if run_dir under evidence/
    try:
        # prefer path relative to task (parent of evidence)
        task_guess = run_dir
        while task_guess.name != "evidence" and task_guess.parent != task_guess:
            task_guess = task_guess.parent
        task_root = task_guess.parent if task_guess.name == "evidence" else run_dir.parent
    except Exception:
        task_root = run_dir.parent

    out = []
    for r in results:
        cid = case_id_from_script(r.get("script") or "")
        if not cid:
            continue
        ok = bool(r.get("success"))
        status = "passed" if ok else "failed"
        report = r.get("report") or ""
        # normalize report path under run_dir
        report_path = Path(str(report).replace("\\", "/"))
        if not report_path.is_absolute():
            cand = run_dir / report_path
        else:
            cand = report_path
        try:
            rel = cand.resolve().relative_to(task_root.resolve()).as_posix()
        except Exception:
            rel = f"evidence/{run_dir.name}/report/{report_path.name}" if report_path.name else ""
        fclass = None if ok else "harness"
        # if error looks like env/data
        err = (r.get("error") or "").lower()
        if not ok:
            if "not accessible" in err or "timeout" in err and "login" in err:
                fclass = "env"
            elif "insufficient" in err or "no-rows" in err or "前置" in (r.get("error") or ""):
                fclass = "data"
            elif "replanned" in err or "save_called" in err or "no-form" in err:
                fclass = "harness"
            else:
                fclass = "product"
        out.append((cid, status, rel, fclass))
    return out


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--task", required=True, help="Task directory containing test-cases.jsonl")
    p.add_argument("--id", help="Case id")
    p.add_argument("--status", choices=["pending", "passed", "failed", "blocked", "deferred", "partial"])
    p.add_argument("--evidence", default=None)
    p.add_argument("--notes", default=None)
    p.add_argument(
        "--failure-class",
        dest="failure_class",
        choices=["product", "harness", "env", "data", "flake"],
        default=None,
    )
    p.add_argument("--from-midscene-summary", dest="summary", default=None)
    p.add_argument("--run-dir", default=None, help="Midscene run dir for evidence relative paths")
    args = p.parse_args(argv)

    task = Path(args.task).resolve()
    jsonl = task / "test-cases.jsonl"
    cases = load_jsonl(jsonl)
    updated = 0

    if args.summary:
        run_dir = Path(args.run_dir).resolve() if args.run_dir else Path(args.summary).resolve().parent
        for cid, status, evidence, fclass in from_midscene_summary(Path(args.summary), run_dir):
            if apply_one(cases, cid, status, evidence, None, fclass):
                updated += 1
                print(f"{cid} -> {status} evidence={evidence} failure_class={fclass}")
            else:
                print(f"WARN: case not found {cid}", file=sys.stderr)
    else:
        if not args.id or not args.status:
            raise SystemExit("--id and --status required unless --from-midscene-summary")
        if apply_one(cases, args.id, args.status, args.evidence, args.notes, args.failure_class):
            updated = 1
            print(f"{args.id} -> {args.status}")
        else:
            raise SystemExit(f"case not found: {args.id}")

    write_jsonl(jsonl, cases)
    print(f"updated={updated} total={len(cases)} path={jsonl}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
