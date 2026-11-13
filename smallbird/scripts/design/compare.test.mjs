// 대조 로직 회귀 테스트. 2026-11-13 마이페이지 실측에서 나온 오탐·누락 사례를 작은 데이터로 고정한다.
//   node --test scripts/design   (pnpm test:scripts)
import assert from "node:assert/strict";
import { test } from "node:test";

import { compareScreen } from "./compare.mjs";

// ── 시안·구현 데이터 만들기 ─────────────────────────────────────
const frame = (name, box, children = [], extra = {}) => ({
  id: name,
  type: "FRAME",
  name,
  box,
  children,
  ...extra,
});
const col = (gap, pad = [0, 0, 0, 0]) => ({
  layout: { dir: "col", pad, gap, main: "MIN", cross: "MIN" },
});
const row = (gap, pad = [0, 0, 0, 0]) => ({
  layout: { dir: "row", pad, gap, main: "MIN", cross: "MIN" },
});
const text = (chars, box, t = {}) => ({
  id: `t:${chars}:${box[0]},${box[1]}`,
  type: "TEXT",
  name: chars,
  box,
  text: {
    chars,
    size: 14,
    weight: 400,
    lh: 20,
    ls: 0,
    color: { hex: "#020617" },
    ...t,
  },
});
const spec = (root) => ({
  frame: { id: "f", name: "테스트", w: 400, h: 400 },
  rootOffset: [0, 0],
  root,
});

// 구현 행: [태그, 부모 번호, 상자, 속성]
const impl = (list) => ({
  url: "/test",
  origin: [0, 0],
  rows: list.map(([tag, p, [x, y, w, h], props = {}], i) => ({
    i,
    p,
    tag,
    x,
    y,
    w,
    h,
    ...props,
  })),
});
const txt = (label, extra = {}) => ({
  label,
  font: "14/400/20",
  color: "#020617",
  ...extra,
});
const props = (r) => r.candidates.map((c) => `${c.prop}:${c.figma}/${c.impl}`);

test("padding 을 행에 줬든 셀에 줬든 글자 위치가 같으면 차이가 아니다", () => {
  // 시안: 행(padding 0) > 셀(padding 16) > 글자 / 구현: 행(padding 16) > 글자
  const s = spec(
    frame(
      "Root",
      [0, 0, 400, 100],
      [
        frame(
          "Row",
          [0, 0, 400, 48],
          [
            frame(
              "Cell",
              [0, 0, 200, 48],
              [text("회사명", [16, 14, 60, 20])],
              row(0, [14, 16, 14, 16]),
            ),
          ],
          row(0),
        ),
      ],
      col(0),
    ),
  );
  const m = impl([
    ["main", undefined, [0, 0, 400, 100]],
    ["div", 0, [0, 0, 400, 48], { pad: "14 16 14 16" }],
    ["span", 1, [16, 14, 60, 20], txt("회사명")],
  ]);
  const r = compareScreen(s, m);
  assert.deepEqual(
    props(r).filter((p) => p.includes("여백")),
    [],
  );
});

test("자식 사이 간격 차이를 찾고, 시안의 감싸는 컨테이너가 구현에 없어도 찾는다", () => {
  // 시안: Section > [제목, Container(gap 12) > [토글, 카드]] / 구현: section > [제목, 토글, 카드](간격 16)
  const s = spec(
    frame(
      "Root",
      [0, 0, 400, 200],
      [
        text("상품 선택", [0, 0, 80, 16]),
        frame(
          "Container",
          [0, 32, 400, 132],
          [
            frame(
              "Toggle",
              [0, 32, 100, 40],
              [text("월간", [10, 42, 30, 20])],
              row(0, [10, 10, 10, 10]),
            ),
            frame(
              "Cards",
              [0, 84, 400, 80],
              [text("모집형", [10, 94, 50, 20])],
              row(0, [10, 10, 10, 10]),
            ),
          ],
          col(12),
        ),
      ],
      col(16),
    ),
  );
  const m = impl([
    ["main", undefined, [0, 0, 400, 200]],
    ["h2", 0, [0, 0, 80, 16], txt("상품 선택")],
    ["div", 0, [0, 32, 100, 40], { pad: "10 10 10 10" }],
    ["span", 2, [10, 42, 30, 20], txt("월간")],
    ["div", 0, [0, 88, 400, 80], { pad: "10 10 10 10" }],
    ["span", 4, [10, 98, 50, 20], txt("모집형")],
  ]);
  const r = compareScreen(s, m);
  assert.ok(props(r).includes("자식 사이 간격:12/16"), props(r).join(" | "));
});

test("반복 문구는 같은 카드 안의 것끼리 짝짓는다(다른 카드와 짝지어 폭 1170 같은 오탐을 내지 않음)", () => {
  const card = (x, title) =>
    frame(
      `Card ${title}`,
      [x, 0, 180, 100],
      [
        text(title, [x + 20, 20, 60, 20]),
        text("상세보기", [x + 20, 60, 60, 20]),
      ],
      col(20, [20, 20, 20, 20]),
    );
  const s = spec(
    frame(
      "Root",
      [0, 0, 400, 100],
      [card(0, "모집형"), card(200, "PICK형")],
      row(20),
    ),
  );
  const m = impl([
    ["main", undefined, [0, 0, 400, 100]],
    [
      "div",
      0,
      [0, 0, 180, 100],
      { pad: "20 20 20 20", border: "1px solid #E2E8F0" },
    ],
    ["p", 1, [20, 20, 60, 20], txt("모집형")],
    ["button", 1, [20, 60, 60, 20], txt("상세보기")],
    [
      "div",
      0,
      [200, 0, 180, 100],
      { pad: "20 20 20 20", border: "1px solid #E2E8F0" },
    ],
    ["p", 4, [220, 20, 60, 20], txt("PICK형")],
    ["button", 4, [220, 60, 60, 20], txt("상세보기")],
  ]);
  const r = compareScreen(s, m);
  assert.equal(r.matched.texts, 4);
  assert.deepEqual(
    props(r).filter((p) => /폭|간격|여백/.test(p)),
    [],
  );
});

test("글자를 직접 담은 표 셀(padding 있음)도 컨테이너로 보고 고정 폭 차이를 찾는다", () => {
  const s = spec(
    frame(
      "Root",
      [0, 0, 400, 48],
      [
        frame("Cell", [0, 0, 65, 48], [text("구분", [16, 14, 30, 20])], {
          ...row(0, [14, 16, 14, 16]),
          sizing: ["FIXED", "FIXED"],
        }),
        frame("Cell2", [65, 0, 120, 48], [text("일자", [81, 14, 30, 20])], {
          ...row(0, [14, 16, 14, 16]),
          sizing: ["FIXED", "FIXED"],
        }),
      ],
      row(0),
    ),
  );
  const m = impl([
    ["tr", undefined, [0, 0, 400, 48]],
    ["th", 0, [0, 0, 71, 48], txt("구분", { pad: "14 16 14 16" })],
    ["th", 0, [71, 0, 120, 48], txt("일자", { pad: "14 16 14 16" })],
  ]);
  const r = compareScreen(s, m);
  assert.ok(props(r).includes("폭(고정):65/71"), props(r).join(" | "));
});

test("탭 밑줄을 테두리로 그렸든 별도 막대로 그렸든 같은 자리·같은 색이면 차이가 아니다", () => {
  const s = spec(
    frame(
      "Root",
      [0, 0, 400, 40],
      [
        frame("Tab", [0, 0, 60, 36], [text("구독", [16, 8, 28, 20])], {
          ...row(0, [8, 16, 8, 16]),
          stroke: { hex: "#2563EB", w: [0, 0, 2, 0], align: "INSIDE" },
        }),
      ],
      row(0),
    ),
  );
  const m = impl([
    ["div", undefined, [0, 0, 400, 40]],
    ["button", 0, [0, 0, 60, 36], txt("구독", { pad: "8 16 8 16" })],
    ["span", 0, [0, 34, 60, 2], { bg: "#2563EB" }],
  ]);
  const r = compareScreen(s, m);
  assert.deepEqual(
    props(r).filter((p) => p.startsWith("선")),
    [],
  );
});

test("배경을 칠한 요소가 달라도 보이는 색이 같으면 차이가 아니다", () => {
  const s = spec(
    frame(
      "Root",
      [0, 0, 400, 48],
      [
        frame("Header Row", [0, 0, 400, 48], [text("구분", [16, 14, 30, 20])], {
          ...row(0, [14, 16, 14, 16]),
          fill: { hex: "#F1F5F9", a: 0.4 },
        }),
      ],
      col(0),
    ),
  );
  const m = impl([
    ["thead", undefined, [0, 0, 400, 48], { bg: "#F1F5F9/40%" }],
    ["th", 0, [0, 0, 400, 48], txt("구분", { pad: "14 16 14 16" })],
  ]);
  const r = compareScreen(s, m);
  assert.deepEqual(
    props(r).filter((p) => p.startsWith("배경")),
    [],
  );
});

test("텍스트 스타일 행간 차이를 찾고 스타일 이름을 함께 남긴다", () => {
  const s = spec(
    frame(
      "Root",
      [0, 0, 400, 40],
      [
        text("상세 내역", [0, 0, 60, 16], {
          size: 16,
          weight: 600,
          lh: 16,
          style: "text-base/leading-none/semibold",
        }),
      ],
      col(0),
    ),
  );
  const m = impl([
    ["main", undefined, [0, 0, 400, 40]],
    ["h3", 0, [0, 0, 60, 24], txt("상세 내역", { font: "16/600/24" })],
  ]);
  const r = compareScreen(s, m);
  const c = r.candidates.find((x) => x.prop === "행간");
  assert.ok(
    c &&
      c.figma === 16 &&
      c.impl === 24 &&
      c.note.includes("text-base/leading-none/semibold"),
  );
});

test("데이터 행이 시안보다 많아도, 같은 모양의 행 구분선은 '구현에만 있는 선'으로 내지 않는다", () => {
  const line = (y) =>
    frame(`Row${y}`, [0, y, 400, 48], [text(`값${y}`, [16, y + 14, 40, 20])], {
      ...row(0, [14, 16, 14, 16]),
      stroke: { hex: "#E2E8F0", w: [0, 0, 1, 0], align: "INSIDE" },
    });
  const s = spec(frame("Root", [0, 0, 400, 96], [line(0), line(48)], col(0)));
  const rows = [["tbody", undefined, [0, 0, 400, 240]]];
  for (let k = 0; k < 5; k++)
    rows.push([
      "tr",
      0,
      [0, k * 48, 400, 48],
      txt(`데이터${k}`, {
        pad: "14 16 14 16",
        border: "0px 0px 1px solid #E2E8F0",
      }),
    ]);
  const r = compareScreen(s, impl(rows));
  assert.deepEqual(
    props(r).filter((p) => p.startsWith("선(구현에만)")),
    [],
  );
});

test("여러 화면에 같은 컴포넌트·같은 값의 차이가 있으면 공통 후보 하나로 묶는다", async () => {
  const { groupAcrossScreens } = await import("./compare.mjs");
  const cand = (id, component, prop, figma, impl) => ({
    id,
    component,
    prop,
    figma,
    impl,
    labels: [component],
    count: 1,
    items: [],
  });
  const results = {
    "01": {
      candidates: [
        cand("c1", "Button", "행간", 22, 24),
        cand("c2", "Card", "radius", 8, 6),
      ],
    },
    "02": {
      candidates: [
        cand("c4", "Button", "행간", 22, 24),
        cand("c5", "Button", "행간", 16, 20),
      ],
    },
  };
  const { groups, memberOf } = groupAcrossScreens(results);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].members, [
    { screen: "01", id: "c1" },
    { screen: "02", id: "c4" },
  ]);
  assert.equal(memberOf.get("02|c5"), undefined); // 값이 다르면(기기별 차이) 따로 둔다
});
