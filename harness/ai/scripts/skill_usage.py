#!/usr/bin/env python3
"""
skill_usage.py — 이 PC 의 Claude Code 세션 기록에서 skill 사용을 집계한다.

skill 은 에이전트가 description 을 보고 스스로 읽는 문서라, 실제로 읽히는지는 기록으로만 알 수 있다.
skill 마다 "사용한 세션 수"와 "사용자가 이름을 말하지 않았는데 스스로 읽은 세션 수"를 보여 준다.
스스로 읽은 비율이 낮은 skill 은 description 의 "어떤 작업일 때 읽는지"를 고칠 후보다.

  python3 ai/scripts/skill_usage.py [--since YYYY-MM-DD]

- 대상: `.claude/skills/*/SKILL.md` 의 skill (새 skill 은 자동으로 포함).
- 기록: `~/.claude/projects/` 에서 이 저장소와 워크트리(`../<저장소>-*`)에 해당하는 폴더의 `*.jsonl` (서브에이전트 포함).
- 사용으로 보는 것: Skill 도구 호출, 또는 SKILL.md 를 Read 로 읽음.
- 사용자가 이름을 말함: 사용자가 직접 쓴 메시지(슬래시 명령 포함)에 skill 이름이 있음. 시스템이 붙인 안내·도구 결과는 제외.
- 한계: 이 PC 의 Claude Code 기록만 본다(Codex·다른 팀원 PC 제외). "필요했는데 안 읽은 작업"은 판단하지 않는다.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import subprocess
import sys
from collections import defaultdict

SYSTEM_BLOCK = re.compile(r"<system-reminder>.*?</system-reminder>", re.DOTALL)


def repo_root() -> pathlib.Path:
    # 워크트리에서 실행해도 메인 저장소 기준으로 기록 폴더를 찾는다.
    common = subprocess.run(
        ["git", "rev-parse", "--path-format=absolute", "--git-common-dir"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return pathlib.Path(common).parent


def encode(path: pathlib.Path) -> str:
    # Claude Code 는 프로젝트 경로의 영숫자가 아닌 문자를 '-' 로 바꿔 기록 폴더 이름으로 쓴다.
    return re.sub(r"[^A-Za-z0-9]", "-", str(path))


def session_dirs(root: pathlib.Path) -> list[pathlib.Path]:
    base = pathlib.Path.home() / ".claude" / "projects"
    prefix = encode(root)
    if not base.exists():
        return []
    return [d for d in base.iterdir() if d.is_dir() and (d.name == prefix or d.name.startswith(prefix + "-"))]


def user_text(entry: dict) -> str:
    """사용자가 직접 쓴 글만 돌려준다. skill 본문 주입(isMeta)·도구 결과·시스템 안내는 뺀다."""
    if entry.get("type") != "user" or entry.get("isMeta"):
        return ""
    content = (entry.get("message") or {}).get("content")
    if isinstance(content, str):
        texts = [content]
    elif isinstance(content, list):
        texts = [b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text"]
    else:
        return ""
    return SYSTEM_BLOCK.sub("", "\n".join(texts))


def used_skills(entry: dict, names: set[str]) -> set[str]:
    content = (entry.get("message") or {}).get("content")
    found: set[str] = set()
    if entry.get("type") != "assistant" or not isinstance(content, list):
        return found
    for block in content:
        if not isinstance(block, dict) or block.get("type") != "tool_use":
            continue
        tool_input = block.get("input") or {}
        if block.get("name") == "Skill":
            # 플러그인 skill 은 "plugin:name" 형태다. 이 저장소 skill 만 센다.
            skill = str(tool_input.get("skill", ""))
            if skill in names:
                found.add(skill)
        elif block.get("name") == "Read":
            m = re.search(r"\.(?:claude|agents)/skills/([^/]+)/SKILL\.md$", str(tool_input.get("file_path", "")))
            if m and m.group(1) in names:
                found.add(m.group(1))
    return found


def main() -> int:
    parser = argparse.ArgumentParser(description="Claude Code 세션 기록에서 skill 사용을 집계한다.")
    parser.add_argument("--since", default="", help="이 날짜(YYYY-MM-DD) 이후 시작한 세션만 본다.")
    args = parser.parse_args()

    root = repo_root()
    names = {p.parent.name for p in (root / ".claude" / "skills").glob("*/SKILL.md")}
    if not names:
        print("집계할 skill 이 없습니다(.claude/skills/*/SKILL.md).")
        return 1
    dirs = session_dirs(root)
    if not dirs:
        print(f"세션 기록 폴더가 없습니다: ~/.claude/projects/{encode(root)}*")
        return 1

    sessions = 0
    used = defaultdict(int)
    self_started = defaultdict(int)
    last_used: dict[str, str] = {}

    for f in sorted(p for d in dirs for p in d.rglob("*.jsonl")):
        started = ""
        skills: set[str] = set()
        named: set[str] = set()
        for line in f.read_text(encoding="utf-8", errors="ignore").splitlines():
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            started = started or entry.get("timestamp", "")
            text = user_text(entry)
            named.update(n for n in names if n in text)
            skills.update(used_skills(entry, names))
        if not started or started[:10] < args.since:
            continue
        sessions += 1
        for s in skills:
            used[s] += 1
            if s not in named:
                self_started[s] += 1
            last_used[s] = max(last_used.get(s, ""), started[:10])

    period = f"{args.since} 이후" if args.since else "전체 기간"
    print(f"세션 {sessions}개 ({period}, 기록 폴더 {len(dirs)}개)\n")
    width = max(len(n) for n in names)
    print(f"{'skill':<{width}}  사용 세션  스스로 읽음  마지막 사용")
    for n in sorted(names, key=lambda n: (-used[n], n)):
        print(f"{n:<{width}}  {used[n]:>9}  {self_started[n]:>11}  {last_used.get(n, '-')}")
    print("\n'스스로 읽음' = 사용자가 skill 이름을 말하지 않았는데 에이전트가 읽은 세션. 해당 작업을 했는데도 낮으면 description 을 고칠 후보입니다.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
