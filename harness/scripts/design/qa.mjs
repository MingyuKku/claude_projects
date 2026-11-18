// 디자인 QA 일괄 실행. 화면 목록(screens.json) 하나로 시안 수집·측정 준비·대조·보고서를 처리한다.
//   node scripts/design/qa.mjs prepare <screens.json>  → 시안 지정값·이미지 받기, 측정 실행 파일(run.js) 만들기
//   (Playwright MCP) browser_run_code_unsafe {filename: run.js} → browser_evaluate {function: DUMP, filename: impl.json}
//   node scripts/design/qa.mjs compare <screens.json>  → 화면별 차이 후보(c1, c2…) 출력
//   node scripts/design/qa.mjs report <screens.json>   → 같은 폴더 verdicts.json(판정)으로 HTML 보고서 만들기
//
// screens.json 은 보고서 폴더(.claude/figma-cache/qa/<페이지>-<날짜>/)에 둔다. 형식은 design-qa skill references/workflow.md.
import { execFileSync, execSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import {
  compareScreen,
  formatGroups,
  formatResult,
  groupAcrossScreens,
} from "./compare.mjs";
import { fetchImages, fetchSpecs, fileName } from "./figma.mjs";

const SKILL = path.resolve(".claude/skills/design-qa/references");
const MEASURE = path.join(SKILL, "measure.js");
const TEMPLATE = path.join(SKILL, "report-template.html");
export const DUMP =
  "() => Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith('__qa:')).map((k) => [k.slice(5), JSON.parse(localStorage.getItem(k))]))";

const [command, configPath] = process.argv.slice(2);
if (!["prepare", "compare", "report"].includes(command) || !configPath) {
  console.error("사용법: qa.mjs prepare|compare|report <screens.json>");
  process.exit(1);
}
const config = JSON.parse(readFileSync(configPath, "utf8"));
const DIR = path.dirname(path.resolve(configPath));
const MCP_DIR = path.resolve(config.mcpDir);
const SPECS = path.join(DIR, "specs");
const IMG = path.join(DIR, "img");
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const specPath = (s) => path.join(SPECS, `${fileName(s.figma)}.json`);

async function prepare() {
  const ids = [...new Set(config.screens.map((s) => s.figma))];
  for (const w of await fetchSpecs(ids, SPECS, config.file))
    console.log(
      w.error
        ? `시안 ${w.id}: ${w.error}`
        : `시안 ${w.id} ${w.name} (노드 ${w.nodes})`,
    );
  const images = await fetchImages(ids, SPECS, config.file);
  mkdirSync(IMG, { recursive: true });
  for (const s of config.screens) {
    const src = images.find((w) => w.id === s.figma && w.file)?.file;
    if (src) copyFileSync(src, path.join(IMG, `${s.id}-figma.png`));
  }
  mkdirSync(MCP_DIR, { recursive: true });
  writeFileSync(path.join(MCP_DIR, "run.js"), runScript());
  console.log(
    `\n측정: browser_run_code_unsafe { filename: "${path.join(MCP_DIR, "run.js")}" }`,
  );
  console.log(
    `꺼내기: browser_evaluate { function: "${DUMP}", filename: "${path.join(MCP_DIR, "impl.json")}" }`,
  );
}

// Playwright 서버에서 실행되는 코드. 측정 함수는 초기화 스크립트로 넣어 페이지가 바뀌어도 유지하고,
// 결과는 응답이 아니라 localStorage 에 쌓는다(응답은 화면당 한 줄 요약만).
function runScript() {
  return `async (page) => {
  const SCREENS = ${JSON.stringify(config.screens.map(({ id, url, viewport, root, wait, actions }) => ({ id, url, viewport, root, wait, actions })))};
  const BASE = ${JSON.stringify(config.base)};
  const OUT = ${JSON.stringify(MCP_DIR)};
  await page.context().addInitScript({ path: ${JSON.stringify(MEASURE)} });
  const lines = [];
  let cleared = false;
  for (const s of SCREENS) {
    const started = Date.now();
    try {
      await page.setViewportSize({ width: s.viewport[0], height: s.viewport[1] });
      const url = new URL(s.url, BASE);
      if (!url.searchParams.has('lng')) url.searchParams.set('lng', 'ko');
      await page.goto(url.toString());
      if (!cleared) {
        await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('__qa:')).forEach((k) => localStorage.removeItem(k)));
        cleared = true;
      }
      if (s.wait) await page.getByText(s.wait).first().waitFor({ timeout: 15000 });
      for (const a of s.actions || []) {
        if (a.click) await page.getByText(a.click, { exact: true }).nth(a.nth || 0).click();
        if (a.hover) await page.getByText(a.hover, { exact: true }).nth(a.nth || 0).hover();
        if (a.wait) await page.getByText(a.wait).first().waitFor({ timeout: 15000 });
      }
      // 스켈레톤·열림 애니메이션이 끝나고 글꼴이 불린 뒤에 잰다
      await page.waitForFunction(() => !document.querySelector('[data-slot="skeleton"], [aria-busy="true"]'), null, { timeout: 15000 }).catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const m = await page.evaluate(([root]) => globalThis.__qaMeasure(root, 5000), [s.root || 'main']);
      if (m.error) throw new Error(m.error);
      m.url = url.pathname + url.search;
      await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), ['__qa:' + s.id, m]);
      await page.screenshot({ path: OUT + '/' + s.id + '-impl.png' });
      lines.push(s.id + ' ok rows=' + m.count + (m.scroll ? ' scroll=' + m.scroll : '') + (m.truncated ? ' TRUNCATED' : '') + ' ' + (Date.now() - started) + 'ms');
    } catch (e) {
      lines.push(s.id + ' FAIL ' + String(e.message || e).split('\\n')[0].slice(0, 160));
    }
  }
  return lines.join('\\n');
}
`;
}

// 판정용 캡처: 시안·구현 캡처를 비교 구역(본문)만 잘라 폭 820 이하로 줄여 <폴더>/view/ 에 둔다.
// 이미지를 Read 로 열 때 토큰을 줄이기 위해서다. macOS sips 가 없으면 건너뛴다.
function cropForReview(s, spec, m) {
  const sips = (args) => execFileSync("sips", args, { encoding: "utf8" });
  const out = path.join(DIR, "view");
  mkdirSync(out, { recursive: true });
  const jobs = [
    [
      path.join(IMG, `${s.id}-figma.png`),
      path.join(out, `${s.id}-figma.png`),
      spec.rootOffset,
      spec.root.box[2],
    ],
    [
      path.join(MCP_DIR, `${s.id}-impl.png`),
      path.join(out, `${s.id}-impl.png`),
      m.origin,
      parseFloat(m.size),
    ],
  ];
  try {
    for (const [src, dst, [x, y], w] of jobs) {
      if (!existsSync(src)) continue;
      copyFileSync(src, dst);
      const h = Number(
        sips(["-g", "pixelHeight", dst]).match(/pixelHeight: (\d+)/)[1],
      );
      // sips 는 자를 위치의 가로 값이 0 이면 자르기를 무시한다(macOS 26 확인). 판정용 이미지라 1px 옮겨 자른다.
      const left = Math.max(1, Math.round(x));
      sips([
        "-c",
        String(Math.round(h - y)),
        String(Math.round(w) - (left - Math.round(x))),
        "--cropOffset",
        String(Math.round(y)),
        String(left),
        dst,
      ]);
      if (w > 820) sips(["--resampleWidth", "820", dst]);
    }
  } catch (e) {
    // sips 가 없는 환경(macOS 외)이면 원본 캡처를 그대로 본다
    if (process.env.QA_DEBUG) console.error(s.id, String(e).slice(0, 200));
  }
}

function compare() {
  const implFile = path.join(MCP_DIR, "impl.json");
  if (!existsSync(implFile)) {
    console.error(`${implFile} 가 없습니다. 측정과 꺼내기를 먼저 실행하세요.`);
    process.exit(1);
  }
  const impl = readJson(implFile);
  const out = path.join(DIR, "compare");
  mkdirSync(out, { recursive: true });
  const results = {};
  const lines = [];
  for (const s of config.screens) {
    if (!impl[s.id]) {
      lines.push(`[${s.id}] 측정값 없음`);
      continue;
    }
    if (!existsSync(specPath(s))) {
      lines.push(`[${s.id}] 시안 지정값 없음`);
      continue;
    }
    const spec = readJson(specPath(s));
    results[s.id] = compareScreen(spec, impl[s.id]);
    writeFileSync(
      path.join(out, `${s.id}.json`),
      JSON.stringify(results[s.id], null, 2),
    );
    cropForReview(s, spec, impl[s.id]);
  }
  // 화면을 가로질러 같은 차이를 묶어 먼저 보여 준다(한 번 판정하면 모든 화면에 적용)
  const { groups, memberOf } = groupAcrossScreens(results);
  writeFileSync(path.join(out, "groups.json"), JSON.stringify(groups, null, 2));
  const head = formatGroups(groups);
  if (head) console.log(head);
  for (const l of lines) console.log(l);
  for (const [id, r] of Object.entries(results))
    console.log(formatResult(id, r, memberOf));
}

// 판정(verdicts.json) 형식: { "summary": ["..."], "groups": { "g1": ["중", "메모"] }, "screens": { "01": { "c1": ["중", "메모"], "c2": "x",
//   "c3": ["?", "메모"], "viewed": true, "extra": [{ "element", "prop", "design", "impl", "severity", "note" }],
//   "mismatch": ["..."], "check": ["..."] } } }
//   "x" = 오탐(뺌), "?" = 확인 필요, 상·중·하 = 차이. 판정하지 않은 후보는 확인 필요로 넣는다.
function report() {
  const groupsFile = path.join(DIR, "compare", "groups.json");
  const groups = existsSync(groupsFile) ? readJson(groupsFile) : [];
  const groupOf = new Map();
  for (const g of groups)
    for (const m of g.members) groupOf.set(`${m.screen}|${m.id}`, g);
  const verdicts = existsSync(path.join(DIR, "verdicts.json"))
    ? readJson(path.join(DIR, "verdicts.json"))
    : {};
  const git = (cmd) => execSync(`git ${cmd}`, { encoding: "utf8" }).trim();
  const toBox = (b) => (b ? { x: b[0], y: b[1], w: b[2], h: b[3] } : undefined);
  let figmaVersion;
  const screens = config.screens.map((s) => {
    const base = {
      title: s.title,
      device: s.device,
      width: s.viewport[0],
      url: s.url,
      figmaNode: s.figma,
    };
    const cmpFile = path.join(DIR, "compare", `${s.id}.json`);
    if (s.skip || !existsSync(cmpFile))
      return {
        ...base,
        status: "skipped",
        skipReason: s.skip || "대조 결과 없음",
      };
    const cmp = readJson(cmpFile);
    figmaVersion ??= `${cmp.figma.version} (${cmp.figma.lastModified})`;
    const v = verdicts.screens?.[s.id] || {};
    const check = [...(v.check || [])];
    const diffs = [];
    for (const c of cmp.candidates) {
      // 화면 판정이 없으면 공통 후보(gN) 판정을 쓴다
      const g = groupOf.get(`${s.id}|${c.id}`);
      const verdict = v[c.id] ?? (g && verdicts.groups?.[g.id]);
      const [sev, memo0] = Array.isArray(verdict) ? verdict : [verdict];
      const memo =
        g && !v[c.id]
          ? `공통 ${g.id}(${g.members.length}화면)${memo0 ? ": " + memo0 : ""}`
          : memo0;
      const what = `${c.labels.join(", ")}${c.count > 1 ? ` 외 (총 ${c.count})` : ""} ${c.prop}: 시안 ${c.figma} / 구현 ${c.impl}`;
      if (sev === "x") continue;
      if (!["상", "중", "하"].includes(sev)) {
        check.push(
          `${what}${memo ? ` — ${memo}` : sev === undefined ? " — 미판정" : ""}`,
        );
        continue;
      }
      const first = c.items[0] || {};
      diffs.push({
        element: c.labels.join(", ") + (c.count > 1 ? ` 외` : ""),
        prop: c.prop,
        design: String(c.figma),
        impl: String(c.impl),
        severity: sev,
        note: memo || c.note || "",
        box: toBox(first.iBox),
        figmaBox: toBox(first.fBox),
      });
    }
    for (const e of v.extra || []) diffs.push(e);
    diffs.forEach((d, i) => (d.n = i + 1));
    const implSrc = path.join(MCP_DIR, `${s.id}-impl.png`);
    if (existsSync(implSrc))
      copyFileSync(implSrc, path.join(IMG, `${s.id}-impl.png`));
    return {
      ...base,
      // 캡처를 보고 판정했는지(verdicts 의 viewed). 아니면 다른 화면에서 확인한 패턴으로 판정한 것
      review: v.viewed ? "캡처 확인" : "규칙 판정",
      images: {
        figma: `img/${s.id}-figma.png`,
        figmaWidth: cmp.figma.frame.w,
        impl: `img/${s.id}-impl.png`,
        implWidth: s.viewport[0],
      },
      diffs,
      notes: { mismatch: v.mismatch || [], check },
    };
  });
  const data = {
    title: config.title,
    date: new Date().toISOString().slice(0, 10),
    branch: git("branch --show-current"),
    commit: git("rev-parse --short HEAD"),
    figmaFileKey:
      config.file ||
      readJson(new URL("./figma-design-system.json", import.meta.url)).source
        .file,
    figmaVersion,
    summary: [
      ...(verdicts.summary || []),
      ...groups
        .filter((g) =>
          ["상", "중", "하"].includes([verdicts.groups?.[g.id]].flat()[0]),
        )
        .map((g) => {
          const [sev, memo] = [verdicts.groups[g.id]].flat();
          return `공통 ${g.id} [${g.owner}] ${g.prop}: 시안 ${g.figma} / 구현 ${g.impl} (${sev}, ${g.members.length}화면)${memo ? " — " + memo : ""}`;
        }),
    ],
    screens,
  };
  mkdirSync(IMG, { recursive: true });
  copyFileSync(TEMPLATE, path.join(DIR, "index.html"));
  writeFileSync(
    path.join(DIR, "data.js"),
    `globalThis.QA_REPORT = ${JSON.stringify(data, null, 2)};\n`,
  );
  const n = screens.reduce((sum, s) => sum + (s.diffs?.length || 0), 0);
  console.log(
    `${path.join(DIR, "index.html")}  화면 ${screens.length} · 차이 ${n}`,
  );
}

if (command === "prepare") await prepare();
else if (command === "compare") compare();
else report();
