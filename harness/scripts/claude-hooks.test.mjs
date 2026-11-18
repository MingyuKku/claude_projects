// Claude Code 훅(.claude/hooks/*.sh) 회귀 테스트. 훅이나 scripts/verify.sh 를 고치면 함께 돌린다. (pnpm test:hooks)
// - 실제 훅과 scripts/verify.sh 를 임시 git 저장소에 복사해 실행한다. 레포 작업 트리의 스탬프·표시 파일을 바꾸지 않기 위해서다.
// - eslint·prettier·pnpm 은 가짜 실행 파일로 바꾼다. 검사 도구가 아니라 훅의 분기(교정·되먹임·표시·차단·재시도 한도)만 본다.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// 가짜 도구 기준의 훅 자체 오버헤드 상한. 실제 훅 timeout(60·180초)과는 다르다.
const BUDGET_MS = 3000;
const temps = [];

after(() =>
  temps.forEach((dir) => rmSync(dir, { recursive: true, force: true })),
);

// ── 픽스처 ─────────────────────────────────────────────────────

function writeExecutable(path, body) {
  writeFileSync(path, `#!/bin/sh\n${body}\n`);
  chmodSync(path, 0o755);
}

// 가짜 eslint: 파일에 LINT_ERROR 가 있으면 severity 2 메시지를 담은 JSON 을 내고 exit 1.
const FAKE_ESLINT = `
out="["; sep=""; rc=0
for f in "$@"; do
  case "$f" in -*) continue ;; esac
  if grep -q LINT_ERROR "$f" 2>/dev/null; then
    out="$out$sep{\\"filePath\\":\\"$PWD/$f\\",\\"messages\\":[{\\"severity\\":2,\\"line\\":1,\\"column\\":1,\\"message\\":\\"boom\\",\\"ruleId\\":\\"fake/rule\\"}]}"
    rc=1
  else
    out="$out$sep{\\"filePath\\":\\"$PWD/$f\\",\\"messages\\":[]}"
  fi
  sep=","
done
printf '%s]' "$out"; exit $rc`;

// 가짜 pnpm: 호출을 기록하고 FAKE_RC_<스크립트 이름, : 는 _> 로 종료 코드를 정한다.
const FAKE_PNPM = `
echo "$*" >> "$FAKE_PNPM_LOG"
var="FAKE_RC_$(printf '%s' "$1" | tr ':' '_')"
eval "rc=\\\${$var:-0}"
case "$1" in
  typecheck) echo "src/a.ts(1,1): error TS2322: bad" ;;
  test) echo "FAIL src/a.test.ts" ;;
  test:scripts) printf 'TAP version 13\\nok 1 - a\\nnot ok 2 - b\\n# fail 1\\n' ;;
  ds:tokens:check) echo "ds-tokens.css 가 최신이 아닙니다" ;;
esac
exit "$rc"`;

const SCRIPTS = [
  "typecheck",
  "lint",
  "i18n:check",
  "ds:tokens:check",
  "test",
  "test:scripts",
];

function makeRepo({ scripts = SCRIPTS } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "claude-hooks-"));

  temps.push(dir);

  const git = (...args) =>
    spawnSync("git", args, { cwd: dir, encoding: "utf8" });

  git("init", "-q");
  git("config", "user.email", "t@t");
  git("config", "user.name", "t");
  mkdirSync(join(dir, ".claude/hooks"), { recursive: true });

  for (const file of readdirSync(join(ROOT, ".claude/hooks"))) {
    if (file.endsWith(".sh"))
      cpSync(
        join(ROOT, ".claude/hooks", file),
        join(dir, ".claude/hooks", file),
      );
  }

  mkdirSync(join(dir, "scripts"));
  cpSync(join(ROOT, "scripts/verify.sh"), join(dir, "scripts/verify.sh"));
  mkdirSync(join(dir, "src"));
  mkdirSync(join(dir, "docs"));
  writeFileSync(join(dir, "src/a.ts"), "export const a = 1;\n");
  writeFileSync(join(dir, "docs/a.md"), "# a\n");
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      scripts: Object.fromEntries(scripts.map((name) => [name, "x"])),
    }),
  );
  writeFileSync(
    join(dir, ".gitignore"),
    ".claude/.*\n.claude/hook-log.tsv\nnode_modules\nbin\nnojq\npnpm.log\n",
  );
  mkdirSync(join(dir, "node_modules/.bin"), { recursive: true });
  writeExecutable(join(dir, "node_modules/.bin/eslint"), FAKE_ESLINT);
  writeExecutable(join(dir, "node_modules/.bin/prettier"), "exit 0");
  mkdirSync(join(dir, "bin"));
  writeExecutable(join(dir, "bin/pnpm"), FAKE_PNPM);
  git("add", "-A");
  git("commit", "-qm", "init");

  return { dir, pnpmLog: join(dir, "pnpm.log") };
}

// jq 를 뺀 PATH. macOS 는 /usr/bin 에 jq 가 있어 jq 만 뺀 심볼릭 링크 폴더를 만든다.
function pathWithoutJq(repo) {
  const shim = join(repo.dir, "nojq");

  // 이미 건 이름은 집합으로 거른다. existsSync 는 끊어진 링크(Debian 의 alternatives 등)를 없는 파일로 본다.
  const linked = new Set(["jq"]);

  mkdirSync(shim);

  for (const dir of ["/usr/bin", "/bin"]) {
    for (const file of readdirSync(dir)) {
      if (linked.has(file)) continue;

      linked.add(file);
      symlinkSync(join(dir, file), join(shim, file));
    }
  }

  return `${join(repo.dir, "bin")}:${shim}`;
}

// stdin 에 payload 를 쓰고 닫는다. 예산 안에 끝나지 않으면 죽이고 timedOut 으로 보고한다.
function runHook(repo, hook, payload, { env = {} } = {}) {
  return new Promise((done) => {
    const startedAt = Date.now();
    const child = spawn("sh", [join(repo.dir, ".claude/hooks", hook)], {
      cwd: repo.dir,
      env: {
        ...process.env,
        PATH: `${join(repo.dir, "bin")}:${process.env.PATH}`,
        CLAUDE_PROJECT_DIR: repo.dir,
        FAKE_PNPM_LOG: repo.pnpmLog,
        ...env,
      },
    });
    let stdout = "";
    let timedOut = false;

    child.stdout.on("data", (chunk) => (stdout += chunk));

    const killer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, BUDGET_MS);

    child.on("exit", (code) => {
      clearTimeout(killer);
      done({ code, stdout, timedOut, ms: Date.now() - startedAt });
    });
    child.stdin.end(JSON.stringify(payload));
  });
}

const parseJson = (text) => (text.trim() ? JSON.parse(text) : null);
const exists = (repo, path) => existsSync(join(repo.dir, path));
const pnpmCalls = (repo) =>
  existsSync(repo.pnpmLog)
    ? readFileSync(repo.pnpmLog, "utf8").trim().split("\n")
    : [];
const editPayload = (repo, path) => ({
  hook_event_name: "PostToolUse",
  tool_name: "Edit",
  tool_input: { file_path: join(repo.dir, path) },
});
const stopPayload = (isActive = false, sessionId = "s1") => ({
  hook_event_name: "Stop",
  session_id: sessionId,
  stop_hook_active: isActive,
});

// ── format-and-check.sh (PostToolUse) ──────────────────────────
const FORMAT_HOOK = "format-and-check.sh";

test("PostToolUse: 깨끗한 파일 편집은 출력 없이 exit 0", async () => {
  const repo = makeRepo();
  const result = await runHook(
    repo,
    FORMAT_HOOK,
    editPayload(repo, "src/a.ts"),
  );

  assert.equal(result.code, 0);
  assert.equal(result.stdout, "");
  assert.equal(result.timedOut, false);
});

test("PostToolUse: 남은 ESLint error 는 additionalContext 로 되먹이고 hook-log 에 남긴다", async () => {
  const repo = makeRepo();

  writeFileSync(join(repo.dir, "src/a.ts"), "// LINT_ERROR\n");

  const result = await runHook(
    repo,
    FORMAT_HOOK,
    editPayload(repo, "src/a.ts"),
  );
  const output = parseJson(result.stdout);

  assert.equal(result.code, 0);
  assert.equal(output.hookSpecificOutput.hookEventName, "PostToolUse");
  assert.match(output.hookSpecificOutput.additionalContext, /\[fake\/rule\]/);
  assert.match(
    readFileSync(join(repo.dir, ".claude/hook-log.tsv"), "utf8"),
    /\terror\tfake\/rule\ta\.ts/,
  );
});

test("PostToolUse: 새로 추가한 억제 주석을 알린다", async () => {
  const repo = makeRepo();

  // 이 테스트 파일 자체가 억제 주석 검사에 걸리지 않게 문자열을 나눠 쓴다.
  writeFileSync(
    join(repo.dir, "src/a.ts"),
    `// eslint-${"disable"}-next-line\nexport const a = 1;\n`,
  );

  const result = await runHook(
    repo,
    FORMAT_HOOK,
    editPayload(repo, "src/a.ts"),
  );

  assert.match(
    parseJson(result.stdout).hookSpecificOutput.additionalContext,
    /억제 주석/,
  );
});

test("PostToolUse: 검증 입력(src)을 고치면 미검증 표시를 남기고, 문서만 고치면 남기지 않는다", async () => {
  const repo = makeRepo();

  await runHook(repo, FORMAT_HOOK, editPayload(repo, "docs/a.md"));
  assert.equal(exists(repo, ".claude/.unverified-edits"), false);

  await runHook(repo, FORMAT_HOOK, editPayload(repo, "src/a.ts"));
  assert.equal(exists(repo, ".claude/.unverified-edits"), true);
});

test("PostToolUse(Bash): 스탬프 이후 바뀐 파일을 찾아 검사한다", async () => {
  const repo = makeRepo();
  const bashPayload = {
    hook_event_name: "PostToolUse",
    tool_name: "Bash",
    tool_input: { command: "sed -i" },
  };

  // 첫 실행은 스탬프만 만들고, 누가 바꿨는지 알 수 없어 표시하지 않는다.
  await runHook(repo, FORMAT_HOOK, bashPayload);
  assert.equal(exists(repo, ".claude/.unverified-edits"), false);

  // 스탬프 비교(-nt)가 초 단위인 파일 시스템이 있다.
  await new Promise((wait) => setTimeout(wait, 1100));
  writeFileSync(join(repo.dir, "src/a.ts"), "// LINT_ERROR\n");

  const result = await runHook(repo, FORMAT_HOOK, bashPayload);

  assert.match(
    parseJson(result.stdout).hookSpecificOutput.additionalContext,
    /\[fake\/rule\]/,
  );
  assert.equal(exists(repo, ".claude/.unverified-edits"), true);
});

test("PostToolUse: jq 가 없으면 경고를 되먹이고 exit 0", async () => {
  const repo = makeRepo();
  const result = await runHook(
    repo,
    FORMAT_HOOK,
    editPayload(repo, "src/a.ts"),
    {
      env: { PATH: pathWithoutJq(repo) },
    },
  );

  assert.equal(result.code, 0);
  assert.match(
    parseJson(result.stdout).hookSpecificOutput.additionalContext,
    /jq/,
  );
});

// ── verify-on-stop.sh (Stop) ──────────────────────────────────
const STOP_HOOK = "verify-on-stop.sh";
const markUnverified = (repo) =>
  writeFileSync(join(repo.dir, ".claude/.unverified-edits"), "");

test("Stop: 미검증 표시가 없으면 검사를 돌리지 않는다", async () => {
  const repo = makeRepo();
  const result = await runHook(repo, STOP_HOOK, stopPayload());

  assert.equal(result.code, 0);
  assert.equal(result.stdout, "");
  assert.deepEqual(pnpmCalls(repo), []);
});

test("Stop: verify.sh 의 검사를 lint 만 빼고 돌리고, 통과하면 표시를 지우고 pnpm verify 와 같은 지문을 남긴다", async () => {
  const repo = makeRepo();

  markUnverified(repo);

  const result = await runHook(repo, STOP_HOOK, stopPayload());
  const fingerprint = spawnSync("sh", ["scripts/verify.sh", "--fingerprint"], {
    cwd: repo.dir,
    encoding: "utf8",
  }).stdout.trim();

  assert.equal(result.code, 0);
  assert.equal(result.stdout, "");
  assert.deepEqual(pnpmCalls(repo), [
    "typecheck",
    "i18n:check",
    "ds:tokens:check",
    "test",
    "test:scripts",
  ]);
  assert.equal(exists(repo, ".claude/.unverified-edits"), false);
  assert.equal(
    readFileSync(join(repo.dir, ".claude/.last-verified"), "utf8"),
    fingerprint,
  );
});

test("Stop: package.json 에 없는 검사는 건너뛴다", async () => {
  const repo = makeRepo({ scripts: ["typecheck", "test"] });

  markUnverified(repo);
  await runHook(repo, STOP_HOOK, stopPayload());

  assert.deepEqual(pnpmCalls(repo), ["typecheck", "test"]);
});

test("Stop: 지문이 같으면 다시 돌리지 않는다", async () => {
  const repo = makeRepo();

  markUnverified(repo);
  await runHook(repo, STOP_HOOK, stopPayload());
  markUnverified(repo);
  rmSync(repo.pnpmLog);
  await runHook(repo, STOP_HOOK, stopPayload());

  assert.deepEqual(pnpmCalls(repo), []);
  assert.equal(exists(repo, ".claude/.unverified-edits"), false);
});

test("Stop: 실패한 검사마다 요약을 붙여 block 하고, 지문은 남기지 않는다", async () => {
  const repo = makeRepo();

  markUnverified(repo);

  const result = await runHook(repo, STOP_HOOK, stopPayload(), {
    env: { FAKE_RC_ds_tokens_check: "1", FAKE_RC_test_scripts: "1" },
  });
  const output = parseJson(result.stdout);

  assert.equal(output.decision, "block");
  assert.match(
    output.reason,
    /pnpm ds:tokens:check 실패 \(exit 1\):\nds-tokens\.css 가 최신이 아닙니다/,
  );
  assert.match(output.reason, /스크립트 테스트 실패 \(exit 1\):\nnot ok 2 - b/);
  assert.equal(exists(repo, ".claude/.last-verified"), false);
});

test("Stop: 실패하면 block 하고, MAX_ATTEMPTS(3)회 뒤에는 systemMessage 로 사람에게 넘긴다", async () => {
  const repo = makeRepo();
  const env = { FAKE_RC_typecheck: "2" };

  markUnverified(repo);

  for (let attempt = 1; attempt <= 3; attempt++) {
    const output = parseJson(
      (await runHook(repo, STOP_HOOK, stopPayload(attempt > 1), { env }))
        .stdout,
    );

    assert.equal(output.decision, "block", `attempt ${attempt}`);
    assert.match(output.reason, /타입 오류/);
    assert.equal(
      readFileSync(join(repo.dir, ".claude/.stop-attempts-s1"), "utf8").trim(),
      String(attempt),
    );
  }

  const last = parseJson(
    (await runHook(repo, STOP_HOOK, stopPayload(true), { env })).stdout,
  );

  assert.equal(last.decision, undefined);
  assert.match(last.systemMessage, /3회/);
  assert.equal(exists(repo, ".claude/.unverified-edits"), false);
  assert.equal(exists(repo, ".claude/.stop-attempts-s1"), false);
});

test("Stop: stop_hook_active 가 false 면 재시도 횟수를 새로 센다", async () => {
  const repo = makeRepo();

  markUnverified(repo);
  writeFileSync(join(repo.dir, ".claude/.stop-attempts-s1"), "3");

  const output = parseJson(
    (
      await runHook(repo, STOP_HOOK, stopPayload(false), {
        env: { FAKE_RC_test: "1" },
      })
    ).stdout,
  );

  assert.equal(output.decision, "block");
  assert.match(output.reason, /테스트 실패/);
});

test("Stop: session_id 의 경로 문자는 카운터 파일 이름에서 지운다", async () => {
  const repo = makeRepo();

  markUnverified(repo);
  await runHook(repo, STOP_HOOK, stopPayload(false, "../../evil"), {
    env: { FAKE_RC_test: "1" },
  });

  assert.equal(exists(repo, ".claude/.stop-attempts-evil"), true);
  assert.equal(existsSync(join(repo.dir, "../evil")), false);
});
