#!/usr/bin/env python3
"""
render_agents.py — Cross-platform renderer for AI agent definitions.
Renders ai/agents/source/*.md into:
  - .claude/agents/<name>.md
  - .codex/agents/<name>.toml
  - .claude/skills/<skill>/**  ->  .agents/skills/<skill>/**  (Codex discovers skills there)
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys


def parse_frontmatter(content: str) -> tuple[dict[str, str], str]:
    """Extract YAML-like scalar frontmatter and body."""
    lines = content.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, content

    fm_lines: list[str] = []
    body_lines: list[str] = []
    in_fm = True
    found_close = False

    for line in lines[1:]:
        if in_fm and line.strip() == "---":
            in_fm = False
            found_close = True
            continue
        if in_fm:
            fm_lines.append(line)
        else:
            body_lines.append(line)

    if not found_close:
        return {}, content

    metadata: dict[str, str] = {}
    current_key: str | None = None
    current_val: list[str] = []

    for line in fm_lines:
        match = re.match(r"^([a-zA-Z0-9_-]+):\s*(.*)$", line)
        if match:
            if current_key:
                metadata[current_key] = "\n".join(current_val).strip()
            current_key = match.group(1).strip()
            val_part = match.group(2).strip()
            if val_part.startswith('"') and val_part.endswith('"') and len(val_part) > 1:
                # Double-quoted scalars use JSON-compatible escapes (\n, \", \\).
                try:
                    val_part = json.loads(val_part)
                except json.JSONDecodeError as exc:
                    raise ValueError(f"invalid quoted frontmatter value for '{match.group(1)}': {exc}") from exc
            current_val = [val_part]
        elif current_key:
            current_val.append(line)

    if current_key:
        metadata[current_key] = "\n".join(current_val).strip()

    body = "\n".join(body_lines).strip()
    return metadata, body


def render_claude(tmpl: str, name: str, desc: str, tools: str, model: str, color: str, memory: str, body: str) -> str:
    memory_line = f"memory: {memory}" if memory else ""
    res = tmpl.replace("{name}", name)
    # A JSON string is a valid YAML double-quoted scalar, so quotes/newlines/backslashes stay safe.
    res = res.replace("{description}", json.dumps(desc, ensure_ascii=False))
    res = res.replace("{claude_tools}", tools or "Glob, Grep, Read, Edit, Write")
    res = res.replace("{claude_model}", model or "sonnet")
    res = res.replace("{claude_color}", color or "blue")
    res = res.replace("{claude_memory}", memory_line)
    res = res.replace("{body}", body)
    # clean up empty lines in frontmatter
    res = re.sub(r"\n\s*\n---", "\n---", res)
    return res.rstrip() + "\n"


def render_codex(tmpl: str, name: str, desc: str, codex_model: str, body: str, codex_sandbox: str = "") -> str:
    # A JSON string is a valid TOML basic string.
    model_line = f"model = {json.dumps(codex_model)}" if codex_model else ""
    # TOML multi-line literal strings take the body verbatim; fall back to an escaped basic string.
    if "'''" in body:
        instructions = json.dumps(body, ensure_ascii=False)
    else:
        instructions = f"'''\n{body}\n'''"
    res = tmpl.replace("{name_toml}", json.dumps(name))
    res = res.replace("{name}", name)
    res = res.replace("{description}", json.dumps(desc, ensure_ascii=False))
    res = res.replace("{codex_model}", model_line)
    # Omitted sandbox_mode inherits from the parent session.
    res = res.replace("{codex_sandbox}", f"sandbox_mode = {json.dumps(codex_sandbox)}" if codex_sandbox else "")
    res = res.replace("{body}", instructions)
    return res.rstrip() + "\n"


def validate_rendered(path: pathlib.Path, text: str, adapter: str) -> list[str]:
    """Check that a generated agent file is parseable and has the fields its consumer requires."""
    errors: list[str] = []
    if adapter == "codex":
        try:
            import tomllib  # Python 3.11+
        except ImportError:
            tomllib = None
        if tomllib is not None:
            try:
                data = tomllib.loads(text)
            except tomllib.TOMLDecodeError as exc:
                return [f"{path.name}: invalid TOML: {exc}"]
            for key in ("name", "description", "developer_instructions"):
                if not isinstance(data.get(key), str) or not data[key].strip():
                    errors.append(f"{path.name}: missing required field '{key}'")
            return errors
        # Fallback without a TOML parser: structural checks on the keys we generate.
        for key in ("name", "description", "developer_instructions"):
            if not re.search(rf"^{key}\s*=", text, re.MULTILINE):
                errors.append(f"{path.name}: missing required field '{key}'")
        for key in ("name", "description"):
            m = re.search(rf"^{key}\s*=\s*(.+)$", text, re.MULTILINE)
            if m:
                try:
                    json.loads(m.group(1))
                except json.JSONDecodeError as exc:
                    errors.append(f"{path.name}: '{key}' is not a valid quoted string: {exc}")
        if re.search(r"^\[system_prompt\]", text, re.MULTILINE):
            errors.append(f"{path.name}: legacy [system_prompt] table is not supported")
        return errors

    # claude: frontmatter scalars must be single-line, and quoted ones must decode.
    lines = text.splitlines()
    if not lines or lines[0] != "---" or "---" not in lines[1:]:
        return [f"{path.name}: missing frontmatter"]
    fm = lines[1 : lines.index("---", 1)]
    keys: dict[str, str] = {}
    for line in fm:
        m = re.match(r"^([a-zA-Z0-9_-]+):\s*(.*)$", line)
        if not m:
            errors.append(f"{path.name}: unparseable frontmatter line: {line!r}")
            continue
        keys[m.group(1)] = m.group(2)
        if m.group(2).startswith('"'):
            try:
                json.loads(m.group(2))
            except json.JSONDecodeError as exc:
                errors.append(f"{path.name}: '{m.group(1)}' is not a valid quoted string: {exc}")
    for key in ("name", "description"):
        if not keys.get(key):
            errors.append(f"{path.name}: missing required field '{key}'")
    return errors


GENERATED_MARKER = "GENERATED FILE"


def find_stale_agents(out_dir: pathlib.Path, suffix: str, names: set[str]) -> list[pathlib.Path]:
    """Generated agent files whose source was deleted or renamed. Hand-written files (no marker) are never touched."""
    if not out_dir.exists():
        return []
    stale = []
    for path in sorted(out_dir.glob(f"*{suffix}")):
        if path.stem in names:
            continue
        if GENERATED_MARKER in path.read_text(encoding="utf-8")[:400]:
            stale.append(path)
    return stale


SKILL_HEADER = "<!-- GENERATED FILE: 직접 수정 금지. 원본은 .claude/skills/{skill}/SKILL.md 이며, 수정 후 `python ai/scripts/render_agents.py` 를 실행하세요. -->\n"


def render_skill_md(text: str, skill: str) -> str:
    """Insert the generated-file header right after the frontmatter."""
    parts = text.split("---\n", 2)
    if len(parts) == 3 and parts[0] == "":
        return "---\n" + parts[1] + "---\n" + SKILL_HEADER.format(skill=skill) + parts[2]
    return SKILL_HEADER.format(skill=skill) + text


def sync_skills(root_dir: pathlib.Path, check: bool) -> tuple[int, int]:
    """Mirror .claude/skills into .agents/skills for Codex. Returns (changed, unchanged)."""
    src_root = root_dir / ".claude" / "skills"
    dst_root = root_dir / ".agents" / "skills"
    changed = unchanged = 0
    expected: set[pathlib.Path] = set()

    for src in sorted(p for p in src_root.rglob("*") if p.is_file()) if src_root.exists() else []:
        rel = src.relative_to(src_root)
        dst = dst_root / rel
        expected.add(dst)
        text = src.read_text(encoding="utf-8")
        if rel.name == "SKILL.md" and len(rel.parts) == 2:
            text = render_skill_md(text, rel.parts[0])
        existing = dst.read_text(encoding="utf-8") if dst.exists() else None
        if existing == text:
            unchanged += 1
            continue
        changed += 1
        if check:
            print(f"[Skill Drift] out of sync: {rel}")
        else:
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_text(text, encoding="utf-8")
            print(f"[Skill Render] wrote: {rel}")

    # Files removed from the source must disappear from the mirror.
    for stale in sorted(p for p in dst_root.rglob("*") if p.is_file()) if dst_root.exists() else []:
        if stale not in expected:
            changed += 1
            if check:
                print(f"[Skill Drift] stale: {stale.relative_to(dst_root)}")
            else:
                stale.unlink()
                print(f"[Skill Render] removed: {stale.relative_to(dst_root)}")
    return changed, unchanged


def main() -> int:
    parser = argparse.ArgumentParser(description="Render agent definitions across AI formats.")
    parser.add_argument("--check", action="store_true", help="Check drift only.")
    parser.add_argument("--apply", action="store_true", default=True, help="Write output files.")
    args = parser.parse_args()

    root_dir = pathlib.Path(__file__).resolve().parent.parent.parent
    source_dir = root_dir / "ai" / "agents" / "source"
    adapters_dir = root_dir / "ai" / "adapters"

    claude_tmpl = (adapters_dir / "claude" / "agent.tmpl").read_text(encoding="utf-8")
    codex_tmpl = (adapters_dir / "codex" / "agent.tmpl").read_text(encoding="utf-8")

    claude_out = root_dir / ".claude" / "agents"
    codex_out = root_dir / ".codex" / "agents"

    changed = 0
    unchanged = 0
    validation_errors: list[str] = []
    source_names: list[str] = []

    for src_file in sorted(source_dir.glob("*.md")):
        content = src_file.read_text(encoding="utf-8")
        try:
            meta, body = parse_frontmatter(content)
        except ValueError as exc:
            print(f"[Agent Invalid] {src_file.name}: {exc}")
            return 1
        name = meta.get("name", src_file.stem)
        source_names.append(name)
        desc = meta.get("description", "")
        claude_model = meta.get("claude_model", "sonnet")
        claude_color = meta.get("claude_color", "blue")
        claude_memory = meta.get("claude_memory", "")
        claude_tools = meta.get("claude_tools", "")
        codex_model = meta.get("codex_model", "gpt-5.4")
        codex_sandbox = meta.get("codex_sandbox", "")

        # Render outputs
        claude_rendered = render_claude(claude_tmpl, name, desc, claude_tools, claude_model, claude_color, claude_memory, body)
        codex_rendered = render_codex(codex_tmpl, name, desc, codex_model, body, codex_sandbox)

        targets = [
            (claude_out / f"{name}.md", claude_rendered, "claude"),
            (codex_out / f"{name}.toml", codex_rendered, "codex"),
        ]

        for path, text, adapter in targets:
            validation_errors.extend(validate_rendered(path, text, adapter))
            existing = path.read_text(encoding="utf-8") if path.exists() else ""
            if existing == text:
                unchanged += 1
            else:
                changed += 1
                if not args.check:
                    path.parent.mkdir(parents=True, exist_ok=True)
                    path.write_text(text, encoding="utf-8")
                    print(f"[Agent Render] {adapter} wrote: {path.name}")
                else:
                    print(f"[Agent Drift] {adapter} out of sync: {path.name}")

    names = {meta_name for meta_name in source_names}
    for out_dir, suffix in ((claude_out, ".md"), (codex_out, ".toml")):
        for stale in find_stale_agents(out_dir, suffix, names):
            changed += 1
            if args.check:
                print(f"[Agent Drift] stale generated file (source removed): {stale.relative_to(root_dir)}")
            else:
                stale.unlink()
                print(f"[Agent Render] removed stale: {stale.relative_to(root_dir)}")

    if validation_errors:
        for err in validation_errors:
            print(f"[Agent Invalid] {err}")
        return 1

    s_changed, s_unchanged = sync_skills(root_dir, args.check)
    changed += s_changed
    unchanged += s_unchanged

    if args.check:
        if changed > 0:
            print(f"[Agent Drift] {changed} agent definition(s) out of sync.")
            return 1
        print("[Agent Drift] All agent definitions in sync.")
        return 0

    print(f"[Agent Render] Done. Updated: {changed}, Unchanged: {unchanged}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
