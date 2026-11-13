# 화면 목록 초안: 프레임과 화면 제목 뽑기

프레임 이름은 복붙 잔재가 많아(`PC / Setting` 수십 개) 믿지 않고, 프레임 위쪽 글자(화면 제목·탭·선택 상태)로 구분합니다. REST로는 프레임 본문 전체(프레임당 약 1MB)를 받아야 제목을 알 수 있어 Plugin API를 씁니다.

- `figma:use_figma`를 부르기 전에 `figma:figma-use` skill을 먼저 불러야 합니다(읽기 전용 호출이라 다른 skill은 필요 없음).
- 아래 코드를 `code`에 그대로 넣고 `ROOT`만 바꿉니다. 결과가 48KB를 넘으면 실패하므로, 그때는 페이지 대신 구역(섹션) 노드로 나눠 부릅니다.
- 결과는 `기기 · node · 좌표 · 높이 · 본문 앞쪽 글자 · 상태 표시` 한 줄씩입니다. 좌표로 같은 화면의 기기별 프레임(세로 줄)과 상태 프레임(가로로 이어짐)을 묶습니다.
- 상태 표시로 프레임을 고릅니다(2026-11-13 실측에서 이걸 안 봐서 메뉴가 열린 프레임과 세그먼트 선택이 다른 프레임을 골랐음).
  - `겹침:…`·`메뉴열림`: 다이얼로그·딤·열린 메뉴가 덮은 상태 프레임. 기본 화면 비교에는 고르지 않고, 그 상태를 검사할 때만 씁니다.
  - `선택[…]`: 선택된 탭·세그먼트·토글 글자. 구현의 기본 선택과 다르면 `screens.json`의 URL(`?tab=`·`?view=`)이나 `actions`로 맞춥니다.
  - `긴본문N`: 본문이 프레임보다 깁니다. `viewport` 높이를 N으로 줘야 아래쪽까지 비교됩니다(첫 화면만 볼 때는 프레임 높이).

```js
const ROOT = "6886:40437";
const root = await figma.getNodeByIdAsync(ROOT);
let page = root;
while (page && page.type !== "PAGE") page = page.parent;
await figma.setCurrentPageAsync(page);
const DEVICE = { 1440: "PC", 768: "TAB", 360: "MO" };
const OVERLAY = /Dimmed|Dialog|Modal|Sheet|Drawer|Popover|Dropdown|Alert|Toast|Tooltip|Menu/i;
const out = [];
// 상태 표시: 겹침(딤·다이얼로그·열린 메뉴), 긴 본문(측정 높이), 선택된 탭·세그먼트·토글
const flagsOf = async (f) => {
  const flags = [];
  for (const c of f.children) {
    if (!c.visible || c.type !== "INSTANCE") continue;
    const m = await c.getMainComponentAsync();
    const name = m ? (m.parent && m.parent.type === "COMPONENT_SET" ? m.parent.name : m.name) : c.name;
    if (OVERLAY.test(name)) flags.push(`겹침:${name}`);
    if (/Sidebar/i.test(name) && f.width < 1440 && /false/i.test((c.variantProperties || {})["Open / Close"] || "")) flags.push("메뉴열림");
  }
  const main = f.findOne((n) => n.name === "Main Content" && n.visible);
  if (main && main.y + main.height > f.height + 1) flags.push(`긴본문${Math.round(main.y + main.height)}`);
  const sel = [];
  for (const n of f.findAllWithCriteria({ types: ["INSTANCE"] })) {
    if (!n.visible || !n.variantProperties) continue;
    const on = Object.entries(n.variantProperties).some(([k, v]) => /select|active|state|property 1/i.test(k) && /^(true|on|selected|active)$/i.test(String(v)));
    const t = on && n.findOne((x) => x.type === "TEXT" && x.visible);
    if (t && !sel.includes(t.characters.slice(0, 10))) sel.push(t.characters.slice(0, 10));
  }
  if (sel.length) flags.push(`선택[${sel.slice(0, 5).join(",")}]`);
  return flags.join(" ");
};
// 본문(Main Content)의 앞쪽 글자 = 화면 제목·탭. 본문이 없으면 프레임 전체에서 뽑는다.
const textsOf = (frame) => {
  const main = frame.findOne((n) => n.name === "Main Content" && n.visible) || frame;
  return main
    .findAllWithCriteria({ types: ["TEXT"] })
    .filter((t) => t.visible)
    .slice(0, 6)
    .map((t) => t.characters.replace(/\s+/g, " ").slice(0, 12));
};
const walk = async (n, depth) => {
  for (const c of n.children || []) {
    if (!c.visible) continue;
    const device = DEVICE[Math.round(c.width)];
    if ((c.type === "FRAME" || c.type === "INSTANCE") && device && depth < 4) {
      const b = c.absoluteBoundingBox;
      out.push(`${device}\t${c.id}\t${Math.round(b.x)},${Math.round(b.y)}\th${Math.round(c.height)}\t${textsOf(c).join("|")}\t${await flagsOf(c)}`);
    } else if (c.type === "SECTION" || c.type === "GROUP" || (c.type === "FRAME" && c.width > 2000)) await walk(c, depth + 1);
  }
};
await walk(root, 0);
return out.join("\n");
```
