// Figma 시안 수집. Figma REST API 결과를 파일로 저장해 에이전트 컨텍스트를 거치지 않게 한다.
// 구현(figma-to-component)과 디자인 QA(design-qa)가 같이 쓴다.
//   node scripts/design/figma.mjs frames <nodeId>             → 노드 아래 기기 크기(1440·768·360) 프레임 목록
//   node scripts/design/figma.mjs scan <nodeId,...> [--out d] → 프레임 목록·상태 표시·주석·프레임별 문구를 <out>/<id>.scan.txt 로 저장
//   node scripts/design/figma.mjs spec <nodeId,...> [--out d]  → 프레임 지정값을 <out>/<id>.json 으로 저장
//   node scripts/design/figma.mjs outline <nodeId,...> [--depth n] → 구현용 요약(지정값 + ds- 클래스 이름)
//   node scripts/design/figma.mjs image <nodeId,...> [--out d] → 프레임 PNG 를 <out>/<id>.png 로 저장
// 공통 옵션: --file <파일 키>(기본: figma-design-system.json 의 파일), --out <폴더>(기본: .claude/figma-cache/specs)
// 토큰은 환경 변수 또는 .env.local 의 FIGMA_TOKEN(file_content:read). 값은 출력하지 않는다.
// 분당 호출 한도(Dev·Full 좌석 Tier 1 기준 10회)가 있어 여러 프레임을 한 번에 요청한다.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const VARIABLES = JSON.parse(
  readFileSync(new URL("./figma-design-system.json", import.meta.url), "utf8"),
);
const DEVICE_BY_WIDTH = { 1440: "PC", 768: "TAB", 360: "MO" };

export function parseArgs(argv) {
  const [command, target, ...rest] = argv;
  const options = {};
  for (let i = 0; i < rest.length; i += 2)
    options[rest[i].replace(/^--/, "")] = rest[i + 1];
  return { command, target, options };
}

function token() {
  if (!process.env.FIGMA_TOKEN && existsSync(".env.local"))
    process.loadEnvFile(".env.local");
  if (!process.env.FIGMA_TOKEN) {
    console.error(
      "FIGMA_TOKEN 이 없습니다. .env.local 에 FIGMA_TOKEN=... 을 넣어 주세요.",
    );
    process.exit(1);
  }
  return process.env.FIGMA_TOKEN;
}

// 분당 호출 한도에 걸리면 Retry-After 만큼 한 번 기다렸다가 다시 부른다. 길면 멈추고 알린다.
export async function api(pathname) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`https://api.figma.com${pathname}`, {
      headers: { "X-Figma-Token": token() },
    });
    if (res.status === 429) {
      const wait = Number(res.headers.get("retry-after") || 60);
      if (wait > 120 || attempt > 0) {
        console.error(`Figma 호출 한도 초과. ${wait}초 뒤에 다시 실행하세요.`);
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    if (!res.ok) {
      console.error(
        `Figma API ${res.status}: ${(await res.text()).slice(0, 200)}`,
      );
      process.exit(1);
    }
    return res.json();
  }
}

const round = (n) => Math.round(n * 10) / 10;
const hex = ({ r, g, b }) =>
  "#" +
  [r, g, b]
    .map((v) =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase();
// 다른 라이브러리에서 온 변수(ID 에 키가 붙은 것)는 이름표에 없으므로 이름 없이 값만 남긴다.
const varName = (alias) => (alias ? VARIABLES.variables[alias.id] : undefined);

function paint(paints) {
  const p = (paints || []).find((x) => x.visible !== false);
  if (!p) return undefined;
  if (p.type !== "SOLID") return { type: p.type };
  const a = round((p.color.a ?? 1) * (p.opacity ?? 1) * 100) / 100;
  const out = { hex: hex(p.color) };
  if (a < 1) out.a = a;
  const v = varName(p.boundVariables?.color);
  if (v) out.var = v;
  return out;
}

// 노드에 연결된 변수 이름(간격·크기·radius 등). 값은 이미 해당 기기 모드로 풀려 있으므로 이름만 남긴다.
function boundNames(node) {
  const out = {};
  for (const [prop, alias] of Object.entries(node.boundVariables || {})) {
    if (
      prop === "fills" ||
      prop === "strokes" ||
      prop === "componentProperties"
    )
      continue;
    if (Array.isArray(alias)) out[prop] = varName(alias[0]);
    else if (alias?.type === "VARIABLE_ALIAS") out[prop] = varName(alias);
    else if (alias && typeof alias === "object") {
      const first = Object.values(alias)[0];
      if (first?.type === "VARIABLE_ALIAS") out[prop] = varName(first);
    }
  }
  return Object.keys(out).length ? out : undefined;
}

const hasText = (node) =>
  node.type === "TEXT" || (node.children || []).some(hasText);
const isIcon = (node) =>
  node.type === "INSTANCE" &&
  !hasText(node) &&
  node.absoluteBoundingBox.width <= 48 &&
  node.absoluteBoundingBox.height <= 48;

function normalize(node, origin, ctx) {
  if (node.visible === false || !node.absoluteBoundingBox) return undefined;
  const b = node.absoluteBoundingBox;
  const out = {
    id: node.id,
    type: node.type,
    name: node.name,
    box: [
      round(b.x - origin.x),
      round(b.y - origin.y),
      round(b.width),
      round(b.height),
    ],
  };
  if (node.layoutSizingHorizontal)
    out.sizing = [node.layoutSizingHorizontal, node.layoutSizingVertical];
  if (node.layoutPositioning === "ABSOLUTE") out.absolute = true;
  if (node.layoutMode && node.layoutMode !== "NONE") {
    out.layout = {
      dir: node.layoutMode === "HORIZONTAL" ? "row" : "col",
      pad: [
        node.paddingTop || 0,
        node.paddingRight || 0,
        node.paddingBottom || 0,
        node.paddingLeft || 0,
      ],
      gap:
        node.primaryAxisAlignItems === "SPACE_BETWEEN"
          ? "between"
          : node.itemSpacing || 0,
      main: node.primaryAxisAlignItems || "MIN",
      cross: node.counterAxisAlignItems || "MIN",
    };
    if (node.layoutWrap === "WRAP") out.layout.wrap = true;
  }
  if (node.type !== "TEXT") {
    const fill = paint(node.fills);
    if (fill) out.fill = fill;
  }
  const stroke = paint(node.strokes);
  if (stroke && node.strokeWeight) {
    const w = node.individualStrokeWeights;
    out.stroke = {
      ...stroke,
      w: w ? [w.top, w.right, w.bottom, w.left] : node.strokeWeight,
      align: node.strokeAlign,
    };
    if (node.strokesIncludedInLayout) out.stroke.inLayout = true;
  }
  if (node.rectangleCornerRadii) out.radius = node.rectangleCornerRadii;
  else if (node.cornerRadius) out.radius = node.cornerRadius;
  if (node.opacity !== undefined && node.opacity < 1)
    out.opacity = round(node.opacity * 100) / 100;
  const effects = (node.effects || []).filter((e) => e.visible !== false);
  if (effects.length)
    out.effects = effects.map((e) => ({
      type: e.type,
      x: e.offset?.x,
      y: e.offset?.y,
      r: e.radius,
      spread: e.spread || 0,
      color: e.color ? `${hex(e.color)}/${round(e.color.a * 100)}%` : undefined,
    }));
  if (node.type === "TEXT") {
    const s = node.style;
    out.text = {
      chars: node.characters.slice(0, 80),
      size: s.fontSize,
      weight: s.fontWeight,
      lh: s.lineHeightUnit === "INTRINSIC_%" ? "auto" : round(s.lineHeightPx),
      ls: round(s.letterSpacing || 0),
      color: paint(node.fills),
      align: s.textAlignHorizontal,
    };
    if (s.textTruncation === "ENDING") out.text.truncate = s.maxLines || 1;
    const styleId = node.styles?.text;
    if (styleId && ctx.styles[styleId])
      out.text.style = ctx.styles[styleId].name;
  }
  const vars = boundNames(node);
  if (vars) out.vars = vars;
  if (node.type === "INSTANCE" && ctx.components[node.componentId]) {
    const c = ctx.components[node.componentId];
    const set = c.componentSetId && ctx.componentSets[c.componentSetId];
    out.component = set ? `${set.name} : ${c.name}` : c.name;
  }
  // 아이콘은 내부 벡터를 보지 않는다(이름·크기·색만 비교).
  if (isIcon(node)) {
    out.icon = true;
    return out;
  }
  if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION") return out;
  const children = (node.children || [])
    .map((c) => normalize(c, origin, ctx))
    .filter(Boolean);
  if (children.length) out.children = children;
  return out;
}

function findMainContent(node) {
  const queue = [node];
  while (queue.length) {
    const n = queue.shift();
    if (n.name === "Main Content" && n.visible !== false) return n;
    queue.push(...(n.children || []));
  }
  return node;
}

export const DEFAULT_FILE = VARIABLES.source.file;
export const fileName = (id) => id.replace(/:/g, "-");
const ensureDir = (dir) => {
  mkdirSync(dir, { recursive: true });
  return dir;
};
const countNodes = (n) =>
  1 + (n.children || []).reduce((sum, c) => sum + countNodes(c), 0);

// 기기 크기 프레임 목록(이름·위치)만 가볍게(depth 3) 받는다. 프레임 이름은 복붙 잔재가 많아 믿지 않으므로
// 화면 제목·상태 표시까지 필요하면 scan 을 쓴다.
export async function listFrames(target, file = DEFAULT_FILE) {
  const data = await api(`/v1/files/${file}/nodes?ids=${target}&depth=3`);
  const found = [];
  const walk = (n) => {
    const b = n.absoluteBoundingBox;
    const device = b && DEVICE_BY_WIDTH[Math.round(b.width)];
    if (device && /FRAME|INSTANCE|COMPONENT/.test(n.type))
      return found.push({
        device,
        id: n.id,
        x: Math.round(b.x),
        y: Math.round(b.y),
        h: Math.round(b.height),
        name: n.name,
      });
    (n.children || []).forEach(walk);
  };
  Object.values(data.nodes).forEach((n) => walk(n.document));
  return found;
}

// 프레임 지정값. 본문(Main Content)만 남기고, 프레임 안에서 본문의 위치(rootOffset)를 함께 저장한다.
export async function fetchSpecs(ids, outDir, file = DEFAULT_FILE) {
  ensureDir(outDir);
  const data = await api(`/v1/files/${file}/nodes?ids=${ids.join(",")}`);
  const written = [];
  for (const id of ids) {
    const entry = data.nodes[id];
    if (!entry) {
      written.push({ id, error: "노드 없음" });
      continue;
    }
    const frame = entry.document;
    const root = findMainContent(frame);
    const ctx = {
      styles: entry.styles,
      components: entry.components,
      componentSets: entry.componentSets,
    };
    const fb = frame.absoluteBoundingBox,
      rb = root.absoluteBoundingBox;
    const spec = {
      file,
      version: data.version,
      lastModified: data.lastModified,
      frame: { id: frame.id, name: frame.name, w: fb.width, h: fb.height },
      rootOffset: [round(rb.x - fb.x), round(rb.y - fb.y)],
      root: normalize(root, rb, ctx),
    };
    const out = path.join(outDir, `${fileName(id)}.json`);
    writeFileSync(out, JSON.stringify(spec));
    written.push({
      id,
      file: out,
      name: frame.name,
      nodes: countNodes(spec.root),
    });
  }
  return written;
}

// ── 페이지 스캔: 프레임 목록 · 주석 · 프레임별 문구 ────────────────────────────
// 로컬 Figma 캐시를 쓰기 위한 것. REST 응답(노드 전체)을 한 번 받아 파일로 정리하므로 MCP 호출 한도를 쓰지 않는다.
// 페이지 하나가 수십 MB 라 아주 큰 페이지는 구역(Section) node 여러 개로 나눠 넘긴다.
const OVERLAY =
  /Dimmed|Dialog|Modal|Sheet|Drawer|Popover|Dropdown|Alert|Toast|Tooltip|Menu/i;
// 덤프에서 이름을 생략하는 작은 컴포넌트(글자는 그대로 남김)
const QUIET = /Badge|Validation|Stepper|Table Base|Lucide|Icon|separator/i;
const visible = (n) => n.visible !== false;
const textsOf = (n, acc = []) => {
  if (!visible(n)) return acc;
  if (n.type === "TEXT") acc.push(n.characters.replace(/\s*\n\s*/g, " / "));
  (n.children || []).forEach((c) => textsOf(c, acc));
  return acc;
};
const variantsOf = (n) =>
  Object.entries(n.componentProperties || {})
    .filter(([, p]) => p.type === "VARIANT")
    .map(([k, p]) => [k, String(p.value)]);
// 폭이 기기 크기와 같은 주석 띠("New · 날짜", 높이 40)가 있어 높이로도 거른다. 가장 작은 화면(MO)도 600
const MIN_SCREEN_HEIGHT = 300;
const deviceOf = (n) =>
  n.absoluteBoundingBox &&
  n.absoluteBoundingBox.height >= MIN_SCREEN_HEIGHT &&
  DEVICE_BY_WIDTH[Math.round(n.absoluteBoundingBox.width)];

function componentName(n, ctx) {
  const c = ctx.components[n.componentId];
  if (!c) return n.name;
  const set = c.componentSetId && ctx.componentSets[c.componentSetId];
  return set ? set.name : c.name;
}

// design-qa 가 화면을 고를 때 쓰는 상태 표시: 겹침(딤·다이얼로그·열린 메뉴), 긴 본문, 선택된 탭·토글
function frameFlags(frame, ctx) {
  const flags = [];
  for (const c of frame.children || []) {
    if (!visible(c) || c.type !== "INSTANCE") continue;
    const name = componentName(c, ctx);
    if (OVERLAY.test(name)) flags.push(`겹침:${name}`);
    const open = variantsOf(c).find(([k]) => k === "Open / Close");
    if (
      /Sidebar/i.test(name) &&
      frame.absoluteBoundingBox.width < 1440 &&
      /false/i.test(open?.[1] || "")
    )
      flags.push("메뉴열림");
  }
  const main = findMainContent(frame);
  if (main !== frame) {
    const fb = frame.absoluteBoundingBox,
      mb = main.absoluteBoundingBox;
    const bottom = Math.round(mb.y - fb.y + mb.height);
    if (bottom > fb.height + 1) flags.push(`긴본문${bottom}`);
  }
  const selected = [];
  const walk = (n) => {
    if (!visible(n)) return;
    if (n.type === "INSTANCE") {
      const on = variantsOf(n).some(
        ([k, v]) =>
          /select|active|state|property 1/i.test(k) &&
          /^(true|on|selected|active)$/i.test(v),
      );
      const first = on && textsOf(n)[0];
      if (first && !selected.includes(first.slice(0, 10)))
        selected.push(first.slice(0, 10));
    }
    (n.children || []).forEach(walk);
  };
  walk(frame);
  if (selected.length) flags.push(`선택[${selected.slice(0, 5).join(",")}]`);
  return flags.join(" ");
}

// 프레임 안 문구를 화면 구조 순서로. 인스턴스는 컴포넌트 이름과 변형을 붙이고, Sidebar 는 한 줄로 접는다.
function frameDump(frame, ctx) {
  const lines = [];
  const walk = (n, d) => {
    if (!visible(n)) return;
    const pad = "  ".repeat(d);
    if (n.type === "TEXT") {
      lines.push(`${pad}"${n.characters.replace(/\s*\n\s*/g, " / ")}"`);
      return;
    }
    if (!n.children || !textsOf(n).length) return;
    if (n.type === "INSTANCE") {
      const name = componentName(n, ctx);
      if (/^Sidebar/i.test(name)) {
        const items = textsOf(n).filter((t) => !/^\d+$/.test(t));
        lines.push(`${pad}<Sidebar> ${items.join(" | ")}`);
        return;
      }
      if (!QUIET.test(name)) {
        const v = variantsOf(n)
          .map(([k, val]) => `${k}=${val}`)
          .join(",");
        lines.push(`${pad}<${name}${v ? `{${v}}` : ""}> ${n.id}`);
      }
    }
    n.children.forEach((c) => walk(c, d + 1));
  };
  (frame.children || []).forEach((c) => walk(c, 1));
  return lines;
}

// REST 응답(nodes?ids=…)을 프레임 목록·주석·덤프로 정리한다. 기기 크기(1440·768·360) 프레임을 화면으로 보고,
// 구역(Section·Group·넓은 Frame) 안으로 들어가며, 그 밖의 최상위 노드(주석·Change log·라벨)는 글자만 남긴다.
export function scanNodes(data, ids) {
  const frames = [],
    notes = [],
    dumps = [];
  for (const id of ids) {
    const entry = data.nodes[id];
    if (!entry) {
      notes.push({ id, type: "ERROR", name: "노드 없음", texts: [] });
      continue;
    }
    const ctx = {
      components: entry.components || {},
      componentSets: entry.componentSets || {},
    };
    const walk = (n, depth) => {
      for (const c of n.children || []) {
        if (!visible(c)) continue;
        const device = deviceOf(c);
        const b = c.absoluteBoundingBox;
        if (
          device &&
          (c.type === "FRAME" || c.type === "INSTANCE") &&
          depth < 4
        ) {
          const main = findMainContent(c);
          frames.push({
            device,
            id: c.id,
            x: Math.round(b.x),
            y: Math.round(b.y),
            h: Math.round(b.height),
            title: textsOf(main)
              .slice(0, 6)
              .map((t) => t.slice(0, 12))
              .join("|"),
            flags: frameFlags(c, ctx),
          });
          dumps.push(
            `=== ${device} ${c.id} ${Math.round(b.x)},${Math.round(b.y)} ${b.width}x${b.height}`,
            ...frameDump(c, ctx),
          );
          continue;
        }
        const isArea =
          c.type === "SECTION" ||
          c.type === "GROUP" ||
          (c.type === "FRAME" && b && b.width > 2000);
        const framesBefore = frames.length,
          notesBefore = notes.length;
        if (isArea) walk(c, depth + 1);
        if (frames.length > framesBefore) continue;
        // 화면이 없는 구역(Change log·구역 제목)은 안쪽 조각 대신 한 덩어리로, 구역 안팎의 주석은 그대로 글자를 남긴다
        notes.length = notesBefore;
        if (textsOf(c).length) note(c);
      }
    };
    const note = (c) => {
      const b = c.absoluteBoundingBox;
      notes.push({
        id: c.id,
        type: c.type,
        name: c.name,
        x: b ? Math.round(b.x) : undefined,
        y: b ? Math.round(b.y) : undefined,
        texts: textsOf(c),
      });
    };
    walk(entry.document, 0);
  }
  return { frames, notes, dumps };
}

export async function scanPage(ids, outDir, file = DEFAULT_FILE) {
  ensureDir(outDir);
  // 호출은 한 번으로 받고, 파일은 node 마다 따로 쓴다. 다음 스캔 때 node 를 다르게 묶어 넘겨도 같은 파일끼리 diff 할 수 있다.
  const data = await api(`/v1/files/${file}/nodes?ids=${ids.join(",")}`);
  const outs = [],
    frameLines = [];
  let noteCount = 0;
  for (const id of ids) {
    const { frames, notes, dumps } = scanNodes(data, [id]);
    const head = `# scan ${id} · file ${file} · version ${data.version} · lastModified ${data.lastModified}`;
    const lines = frames.map((f) =>
      [f.device, f.id, `${f.x},${f.y}`, `h${f.h}`, f.title, f.flags].join("\t"),
    );
    const noteLines = notes.map(
      (n) =>
        `${n.type} ${n.id} "${n.name}"${n.x !== undefined ? ` ${n.x},${n.y}` : ""} :: ${n.texts.join(" ‖ ")}`,
    );
    const out = path.join(outDir, `${fileName(id)}.scan.txt`);
    writeFileSync(
      out,
      [
        head,
        "",
        "## 프레임",
        ...lines,
        "",
        "## 주석 · 그 밖의 노드",
        ...noteLines,
        "",
        "## 프레임별 문구",
        ...dumps,
      ].join("\n") + "\n",
    );
    outs.push(out);
    frameLines.push(...lines);
    noteCount += notes.length;
  }
  return { outs, version: data.version, frameLines, noteCount };
}

export async function fetchImages(
  ids,
  outDir,
  file = DEFAULT_FILE,
  suffix = "",
) {
  ensureDir(outDir);
  const data = await api(
    `/v1/images/${file}?ids=${ids.join(",")}&format=png&scale=1`,
  );
  const written = [];
  for (const [id, url] of Object.entries(data.images)) {
    if (!url) {
      written.push({ id, error: "이미지 없음" });
      continue;
    }
    const res = await fetch(url);
    const out = path.join(outDir, `${fileName(id)}${suffix}.png`);
    writeFileSync(out, Buffer.from(await res.arrayBuffer()));
    written.push({ id, file: out });
  }
  return written;
}

// 구현용 요약: 지정값을 바로 쓸 클래스 이름과 함께 한 줄씩 보여 준다. Figma 변수 이름 앞에 ds- 를 붙인 것이
// 코드 토큰이다(.claude/rules/styling.md). 변수가 없는 값은 숫자만 나오므로 임의 값으로 옮기기 전에 확인한다.
const dsName = (v) => {
  if (!v) return "";
  const m = v.match(/^(?:gap|padding)\/(gap|p)-([\d,]+|px)$/);
  return m ? ` → ds-${m[1]}-${m[2].replace(",", ".")}` : "";
};
const textClass = (style) => {
  const m = style?.match(/^text-([a-z0-9]+)\/leading-([a-z0-9]+)\/([a-z-]+)$/);
  return m ? `ds-text-${m[1]}-${m[2]}-${m[3]}` : style || "";
};
const colorName = (p) =>
  p
    ? `${p.var || p.hex}${p.a !== undefined ? `/${Math.round(p.a * 100)}%` : ""}`
    : "";
export function outline(spec, maxDepth = 99) {
  const lines = [
    `${spec.frame.name} (${spec.frame.id}) ${spec.frame.w}×${spec.frame.h} · version ${spec.version}`,
  ];
  const walk = (n, d) => {
    if (d > maxDepth) return;
    const pad = "  ".repeat(d);
    const parts = [
      `${n.type === "TEXT" ? "T" : n.type === "INSTANCE" ? "I" : "F"} ${n.name}`,
      `${n.box[2]}×${n.box[3]}`,
    ];
    if (n.sizing) parts.push(n.sizing.map((x) => x[0].toLowerCase()).join("/"));
    if (n.component) parts.push(`<${n.component}>`);
    if (n.layout) {
      const l = n.layout,
        v = n.vars || {};
      const padStr = l.pad.every((x) => x === l.pad[0])
        ? `${l.pad[0]}${dsName(v.paddingTop).replace("ds-p-", "ds-p-")}`
        : `${l.pad.join(" ")}`;
      parts.push(
        `${l.dir} gap ${l.gap}${dsName(v.itemSpacing)} pad ${padStr} ${l.main}/${l.cross}${l.wrap ? " wrap" : ""}`,
      );
      if (!l.pad.every((x) => x === l.pad[0]))
        parts.push(
          ["Top", "Right", "Bottom", "Left"]
            .map((k) => dsName(v[`padding${k}`]).replace(" → ", "") || "-")
            .join(" "),
        );
    }
    if (n.fill) parts.push(`bg ${colorName(n.fill)}`);
    if (n.stroke)
      parts.push(
        `border ${Array.isArray(n.stroke.w) ? n.stroke.w.join(" ") : n.stroke.w} ${n.stroke.align.toLowerCase()} ${colorName(n.stroke)}`,
      );
    if (n.radius)
      parts.push(
        `radius ${Array.isArray(n.radius) ? n.radius.join(" ") : n.radius}${n.vars?.rectangleCornerRadii ? ` (${n.vars.rectangleCornerRadii})` : ""}`,
      );
    if (n.opacity !== undefined) parts.push(`opacity ${n.opacity}`);
    if (n.effects)
      parts.push(
        `effects ${n.effects.map((e) => `${e.type} ${e.x},${e.y} ${e.r} ${e.spread} ${e.color}`).join("; ")}`,
      );
    if (n.text)
      parts.push(
        `"${n.text.chars.slice(0, 30)}" ${n.text.size}/${n.text.weight}/${n.text.lh}${n.text.ls ? ` ls ${n.text.ls}` : ""} ${colorName(n.text.color)} ${textClass(n.text.style)}${n.text.truncate ? ` truncate ${n.text.truncate}` : ""}`,
      );
    if (n.icon) parts.push("icon");
    lines.push(pad + parts.join(" · "));
    (n.children || []).forEach((c) => walk(c, d + 1));
  };
  walk(spec.root, 0);
  return lines.join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { command, target, options } = parseArgs(process.argv.slice(2));
  const file = options.file || DEFAULT_FILE;
  const out = options.out || ".claude/figma-cache/specs";
  if (command === "frames" && target) {
    console.log(["device", "id", "x", "y", "h", "name"].join("\t"));
    for (const f of await listFrames(target, file))
      console.log([f.device, f.id, f.x, f.y, f.h, f.name].join("\t"));
  } else if (command === "spec" && target) {
    for (const w of await fetchSpecs(target.split(","), out, file))
      console.log(
        w.error
          ? `${w.id}\t${w.error}`
          : `${w.file}\t${w.name}\t노드 ${w.nodes}개`,
      );
  } else if (command === "outline" && target) {
    // 저장된 spec 파일이 있으면 그것을, 없으면 받아서 보여 준다
    for (const id of target.split(",")) {
      const saved = path.join(out, `${fileName(id)}.json`);
      if (!existsSync(saved)) await fetchSpecs([id], out, file);
      console.log(
        outline(
          JSON.parse(readFileSync(saved, "utf8")),
          Number(options.depth || 99),
        ),
      );
    }
  } else if (command === "scan" && target) {
    // 프레임 목록만 화면에 보이고, 주석·프레임별 문구는 파일에서 필요한 만큼 읽는다
    const scanned = await scanPage(
      target.split(","),
      options.out || ".claude/figma-cache/scans",
      file,
    );
    console.log(
      ["device", "id", "x,y", "h", "본문 앞 글자", "상태"].join("\t"),
    );
    scanned.frameLines.forEach((l) => console.log(l));
    console.log(
      `\n프레임 ${scanned.frameLines.length}개 · 그 밖의 노드 ${scanned.noteCount}개 · version ${scanned.version} → ${scanned.outs.join(", ")}`,
    );
  } else if (command === "image" && target) {
    for (const w of await fetchImages(target.split(","), out, file))
      console.log(w.error ? `${w.id}\t${w.error}` : w.file);
  } else {
    console.error(
      "사용법: figma.mjs frames|scan|spec|outline|image <nodeId[,nodeId...]> [--file 키] [--out 폴더] [--depth n]",
    );
    process.exit(1);
  }
}
