#!/usr/bin/env python3
from __future__ import annotations

import argparse
import pathlib
import re
import sys
from dataclasses import dataclass


PLACEHOLDER_RE = re.compile(r"\{\{\>\s*([^}]+?)\s*\}\}")


@dataclass(frozen=True)
class Job:
    template: str
    output: str


JOBS = [
    Job("templates/AGENTS.md.tmpl", "../../AGENTS.md"),
    Job("templates/CLAUDE.md.tmpl", "../../CLAUDE.md"),
]


def read_text(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8")


def render_template(template_text: str, base_dir: pathlib.Path) -> str:
    def replace(match: re.Match[str]) -> str:
        rel = match.group(1).strip()
        partial_path = (base_dir / rel).resolve()
        if not partial_path.is_file():
            raise FileNotFoundError(f"Missing partial: {rel}")
        return read_text(partial_path).rstrip()

    rendered = PLACEHOLDER_RE.sub(replace, template_text)
    return rendered.rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Render AI instruction templates for bigbird.")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Do not write files. Exit non-zero when rendered output differs.",
    )
    args = parser.parse_args()

    tool_dir = pathlib.Path(__file__).resolve().parent
    changed: list[str] = []

    for job in JOBS:
        template_path = (tool_dir / job.template).resolve()
        output_path = (tool_dir / job.output).resolve()

        template_text = read_text(template_path)
        rendered = render_template(template_text, tool_dir)

        current = ""
        if output_path.exists():
            current = read_text(output_path)

        if current != rendered:
            changed.append(str(output_path))
            if not args.check:
                output_path.parent.mkdir(parents=True, exist_ok=True)
                output_path.write_text(rendered, encoding="utf-8")

    if args.check:
        if changed:
            print("[AI Sync Check] AI instruction files are out of sync:")
            for path in changed:
                print(f" - {path}")
            return 1
        print("[AI Sync Check] All AI instruction files are up to date.")
        return 0

    if changed:
        print("[AI Sync] Rendered AI instruction files:")
        for path in changed:
            print(f" - {path}")
    else:
        print("[AI Sync] No changes. All AI instruction files already up to date.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
