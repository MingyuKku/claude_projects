// 페이지 스캔(scanNodes) 회귀 테스트. 2026-11-16 데모 모드·마이페이지 실측에서 확인한 구조를 작은 데이터로 고정한다.
//   node --test scripts/design   (pnpm test:scripts)
import assert from "node:assert/strict";
import { test } from "node:test";

import { scanNodes } from "./figma.mjs";

// ── REST 응답 모양 만들기 ─────────────────────────────────────
const box = (x, y, width, height) => ({
  absoluteBoundingBox: { x, y, width, height },
});
const text = (characters, extra = {}) => ({
  id: `t:${characters}`,
  type: "TEXT",
  name: characters,
  characters,
  ...box(0, 0, 10, 10),
  ...extra,
});
const node = (type, id, name, b, children = [], extra = {}) => ({
  id,
  type,
  name,
  ...box(...b),
  children,
  ...extra,
});
const instance = (id, componentId, b, children = [], variants = {}) =>
  node("INSTANCE", id, id, b, children, {
    componentId,
    componentProperties: Object.fromEntries(
      Object.entries(variants).map(([k, value]) => [
        k,
        { type: "VARIANT", value },
      ]),
    ),
  });
const COMPONENTS = {
  components: {
    dimmed: { name: "Type=Light", componentSetId: "set-dimmed" },
    alert: { name: "Mobile=False", componentSetId: "set-alert" },
    caption: { name: "Guide Caption/Inform" },
    tab: { name: "Selected=True", componentSetId: "set-tab" },
    sidebar: { name: "Open / Close=False", componentSetId: "set-sidebar" },
    badge: { name: "Type=Blue", componentSetId: "set-badge" },
    button: { name: "Type=Primary", componentSetId: "set-button" },
  },
  componentSets: {
    "set-dimmed": { name: "Dimmed" },
    "set-alert": { name: "Alert Dialog" },
    "set-tab": { name: "Tabs Base / Tab Item" },
    "set-sidebar": { name: "Sidebar / Sub" },
    "set-badge": { name: "Badge" },
    "set-button": { name: "Button" },
  },
};
const response = (root) => ({
  nodes: { [root.id]: { document: root, ...COMPONENTS } },
});

const pcFrame = node(
  "FRAME",
  "1:1",
  "PC / Setting",
  [0, 0, 1440, 800],
  [
    node(
      "FRAME",
      "1:2",
      "Main Content",
      [222, 64, 1218, 1844],
      [
        text("기본정보"),
        instance("1:3", "badge", [0, 0, 40, 20], [text("DEMO")]),
        instance("1:4", "button", [0, 0, 80, 40], [text("완료")], {
          Type: "Primary",
        }),
        text("숨은 문구", { visible: false }),
      ],
    ),
    instance("1:5", "dimmed", [0, 0, 1440, 800]),
    instance("1:6", "alert", [500, 300, 400, 200], [text("데모 작성 완료")]),
  ],
);
const tabFrame = node(
  "FRAME",
  "2:1",
  "TAB",
  [0, 1000, 768, 700],
  [
    instance("2:2", "sidebar", [0, 0, 222, 700], [text("1"), text("결제")], {
      "Open / Close": "False",
    }),
    instance("2:3", "tab", [0, 0, 80, 40], [text("전체")], {
      Selected: "True",
    }),
  ],
);
const page = node(
  "CANVAS",
  "0:1",
  "↳ 데모",
  [0, 0, 0, 0],
  [
    // 화면이 없는 넓은 프레임(Change log)은 한 덩어리 주석으로
    node(
      "FRAME",
      "9:1",
      " ",
      [0, -900, 2256, 831],
      [
        node("FRAME", "9:2", "row", [0, 0, 100, 20], [text("Change log")]),
        node("FRAME", "9:3", "row", [0, 0, 100, 20], [text("3.0.0")]),
      ],
    ),
    node(
      "SECTION",
      "8:1",
      "구역",
      [0, 0, 5000, 3000],
      [
        pcFrame,
        tabFrame,
        instance(
          "8:2",
          "caption",
          [0, -80, 300, 40],
          [text("완료 버튼 클릭 시 알럿 호출")],
        ),
        // 폭이 PC 와 같은 "New" 주석 띠는 화면이 아니라 주석
        instance(
          "8:4",
          "caption",
          [0, -40, 1440, 40],
          [text("New · 26/11/13")],
        ),
        node("FRAME", "8:3", "숨은 프레임", [0, 0, 360, 600], [], {
          visible: false,
        }),
      ],
    ),
  ],
);

test("구역 안의 기기 크기 프레임을 화면으로 찾고, 숨은 프레임은 빼는다", () => {
  const { frames } = scanNodes(response(page), ["0:1"]);
  assert.deepEqual(
    frames.map((f) => [f.device, f.id]),
    [
      ["PC", "1:1"],
      ["TAB", "2:1"],
    ],
  );
  assert.equal(frames[0].title, "기본정보|DEMO|완료");
});

test("상태 표시: 겹침·긴 본문·메뉴열림·선택", () => {
  const [pc, tab] = scanNodes(response(page), ["0:1"]).frames;
  assert.equal(pc.flags, "겹침:Dimmed 겹침:Alert Dialog 긴본문1908");
  assert.equal(tab.flags, "메뉴열림 선택[전체]");
});

test("화면이 없는 넓은 프레임은 한 덩어리, 구역 안 주석도 남긴다", () => {
  const { notes } = scanNodes(response(page), ["0:1"]);
  assert.deepEqual(
    notes.map((n) => [n.id, n.texts.join(" ‖ ")]),
    [
      ["9:1", "Change log ‖ 3.0.0"],
      ["8:2", "완료 버튼 클릭 시 알럿 호출"],
      ["8:4", "New · 26/11/13"],
    ],
  );
});

test("덤프: 숨은 글자는 빼고, 작은 컴포넌트는 이름 없이 글자만, Sidebar 는 한 줄", () => {
  const { dumps } = scanNodes(response(page), ["0:1"]);
  const text = dumps.join("\n");
  assert.ok(text.includes("=== PC 1:1 0,0 1440x800"));
  assert.ok(text.includes("<Button{Type=Primary}> 1:4"));
  assert.ok(text.includes('"DEMO"'));
  assert.ok(!text.includes("<Badge"));
  assert.ok(!text.includes("숨은 문구"));
  assert.ok(text.includes("<Sidebar> 결제"));
});

test("없는 node 는 오류 줄로 남긴다", () => {
  const { notes } = scanNodes({ nodes: {} }, ["404:1"]);
  assert.deepEqual(notes, [
    { id: "404:1", type: "ERROR", name: "노드 없음", texts: [] },
  ]);
});
