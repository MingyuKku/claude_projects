// 시안 지정값(figma.mjs spec)과 구현 측정값(measure.js 결과)을 대조해 차이 후보를 만든다. qa.mjs 가 부른다.
//
// CSS 속성이 어느 요소에 붙었는지가 아니라 화면 결과로 비교한다.
//   짝짓기: 같은 문구(반복 문구는 가장 가까운 고유 문구 기준 위치)로 글자를, 그 글자들만 감싸는 가장 비슷한 크기의
//          요소로 컨테이너를 짝짓는다. 위치로 짝짓지 않으므로 간격이 달라도 짝이 흔들리지 않는다.
//   간격: 컨테이너 시작 → 첫 자식 거리(padding), 이웃 자식 사이 거리(gap)를 양쪽에서 계산해 비교한다.
//   글자: 크기·굵기·행간·자간·색. 배경: 실제로 보이는 색(조상 배경과 투명도 합성). 선: 화면에 그려진 선분(테두리·막대).
// 허용 오차: 위치·크기 1px, 색 채널 2. 결과는 "후보"이고, 데이터 차이·구조 차이로 생긴 것은 에이전트가 캡처를 보고 판정한다.

export function compareScreen(spec, impl) {
  const TOL = 1;
  const near = (a, b, tol = TOL) => Math.abs(a - b) <= tol;
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const round1 = (n) => Math.round(n * 10) / 10;

  // ── 색 ──────────────────────────────────────────────────────
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgbHex = (c) =>
    "#" +
    c
      .map((v) => Math.round(v).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  // 시안 { hex, a } / 구현 "#RRGGBB" 또는 "#RRGGBB/40%" → { rgb, a }
  const fPaint = (p) =>
    p && p.hex ? { rgb: hexRgb(p.hex), a: p.a ?? 1 } : undefined;
  const iPaint = (s) => {
    if (!s || !s.startsWith("#")) return undefined;
    const [h, pct] = s.split("/");
    return { rgb: hexRgb(h), a: pct ? parseFloat(pct) / 100 : 1 };
  };
  const over = (top, under) => ({
    rgb: top.rgb.map((v, i) => v * top.a + under.rgb[i] * (1 - top.a)),
    a: 1,
  });
  // 아래에서부터 겹친 배경을 합성해 실제로 보이는 불투명 색을 만든다(바탕은 흰색).
  const composite = (layers) =>
    layers.reduceRight((acc, l) => (l ? over(l, acc) : acc), {
      rgb: [255, 255, 255],
      a: 1,
    });
  const sameRgb = (x, y) => x.rgb.every((v, i) => Math.abs(v - y.rgb[i]) <= 2);
  const showPaint = (p, name) =>
    p
      ? `${name ? name + " " : ""}${rgbHex(p.rgb)}${p.a < 1 ? "/" + Math.round(p.a * 100) + "%" : ""}`
      : "없음";

  // ── 시안 노드 ───────────────────────────────────────────────
  const fNodes = [];
  (function flatten(n, parent) {
    const node = { ...n, parent, kids: [] };
    if (parent) parent.kids.push(node);
    fNodes.push(node);
    (n.children || []).forEach((c) => flatten(c, node));
  })(spec.root, undefined);
  const fRoot = fNodes[0];
  const fTexts = fNodes.filter((n) => n.type === "TEXT");
  const fChain = (n) => {
    const out = [];
    for (let a = n; a; a = a.parent) out.push(a);
    return out;
  };
  const fVisibleBg = (n) =>
    composite(
      fChain(n).map((a) => (a.type === "TEXT" ? undefined : fPaint(a.fill))),
    );
  const fOwnBg = (n) => n.type !== "TEXT" && fPaint(n.fill);

  // ── 구현 행 ─────────────────────────────────────────────────
  const rows = impl.rows;
  const byIndex = new Map(rows.map((r) => [r.i, r]));
  const iRoot = rows[0];
  const iParent = (r) => (r.p === undefined ? undefined : byIndex.get(r.p));
  const iChain = (r) => {
    const out = [];
    for (let a = r; a; a = iParent(a)) out.push(a);
    return out;
  };
  const iVisibleBg = (r) => composite(iChain(r).map((a) => iPaint(a.bg)));
  const iTexts = rows.filter((r) => r.font && norm(r.label));
  const box4 = (s) => (s ? s.split(/\s+/).map(parseFloat) : [0, 0, 0, 0]);
  const iBorderW = (r) => {
    if (!r.border) return [0, 0, 0, 0];
    const w = r.border
      .match(/^([\d.]+px(?:\s+[\d.]+px){0,3})/)?.[1]
      .split(/\s+/)
      .map(parseFloat) || [0];
    return w.length === 1
      ? [w[0], w[0], w[0], w[0]]
      : w.length === 2
        ? [w[0], w[1], w[0], w[1]]
        : w.length === 3
          ? [w[0], w[1], w[2], w[1]]
          : w;
  };
  // 글자 행은 padding·테두리를 뺀 내용 상자로 위치를 잡는다(시안 글자 노드는 글자 상자).
  const iContent = (r) => {
    const [pt, pr, pb, pl] = box4(r.pad);
    const [bt, br, bb, bl] = iBorderW(r);
    return {
      x: r.x + pl + bl,
      y: r.y + pt + bt,
      w: r.w - pl - pr - bl - br,
      h: r.h - pt - pb - bt - bb,
    };
  };

  // ── ① 글자 짝짓기 ──────────────────────────────────────────
  // 위치는 간격 차이 때문에 어긋날 수 있으므로 쓰지 않는다. 같은 문구끼리, 반복되면 읽는 순서(위→아래, 왼→오른)로 짝짓는다.
  // 개수가 다르면(데이터 행 수 차이 등) 앞에서부터 적은 쪽 개수만큼만 짝짓는다.
  const pairs = new Map(); // 시안 글자 노드 → 구현 행
  const groupBy = (list, key) =>
    list.reduce(
      (m, x) => m.set(key(x), [...(m.get(key(x)) || []), x]),
      new Map(),
    );
  const fByText = groupBy(fTexts, (t) => norm(t.text.chars));
  const iByText = groupBy(iTexts, (r) => norm(r.label));
  // 양쪽에 한 번씩만 나오는 문구 = 기준점
  const anchors = [];
  for (const [text, fs] of fByText) {
    const is = iByText.get(text);
    if (fs.length === 1 && is?.length === 1) {
      pairs.set(fs[0], is[0]);
      anchors.push({ f: fs[0], r: is[0] });
    }
  }
  // 반복 문구: 시안에서 가장 가까운 기준점의 위치 차이만큼 옮긴 자리에서 가장 가까운 구현 글자. 멀면 짝짓지 않는다.
  const MAX_SHIFT = 60;
  const used = new Set(pairs.values());
  const nearestAnchor = (f) =>
    anchors.reduce((best, a) => {
      const d =
        Math.abs(a.f.box[1] - f.box[1]) +
        Math.abs(a.f.box[0] - f.box[0]) * 0.25;
      return !best || d < best.d ? { a, d } : best;
    }, undefined)?.a;
  const textCands = [];
  for (const [text, fs] of fByText) {
    const is = iByText.get(text);
    if (!is || (fs.length === 1 && is.length === 1)) continue;
    for (const f of fs) {
      const a = nearestAnchor(f);
      const ex = a ? f.box[0] + iContent(a.r).x - a.f.box[0] : f.box[0];
      const ey = a ? f.box[1] + iContent(a.r).y - a.f.box[1] : f.box[1];
      for (const r of is) {
        const c = iContent(r);
        const d = Math.abs(c.x - ex) + Math.abs(c.y - ey);
        if (d <= MAX_SHIFT) textCands.push({ f, r, d });
      }
    }
  }
  textCands.sort((a, b) => a.d - b.d);
  for (const { f, r } of textCands) {
    if (pairs.has(f) || used.has(r)) continue;
    pairs.set(f, r);
    used.add(r);
  }
  const usedRows = new Set(pairs.values());
  const textOf = new Map([...pairs].map(([f, r]) => [r, f])); // 구현 행 → 시안 글자

  // ── ② 컨테이너 짝짓기 ──────────────────────────────────────
  // 시안 컨테이너 f 안의 짝지어진 글자들을 모두 감싸고, f 밖의 글자는 감싸지 않는 구현 요소 중 크기가 가장 비슷한 것.
  const isInside = (node, anc) => {
    for (let a = node; a; a = a.parent) if (a === anc) return true;
    return false;
  };
  const matchedUnder = new Map(); // 구현 행 → 그 아래 짝지어진 글자 행들
  for (const r of usedRows)
    for (const a of iChain(r))
      (matchedUnder.get(a) || matchedUnder.set(a, []).get(a)).push(r);
  const fTextDesc = (n) =>
    n.type === "TEXT" ? [n] : n.kids.flatMap(fTextDesc);
  const lca = (list) => {
    const chains = list.map((r) => iChain(r).reverse());
    let common;
    for (let d = 0; ; d++) {
      const v = chains[0][d];
      if (!v || chains.some((c) => c[d] !== v)) return common;
      common = v;
    }
  };
  const containerPairs = new Map([[fRoot, iRoot]]);
  for (const f of fNodes) {
    if (f === fRoot || f.type === "TEXT" || !f.kids.length) continue;
    const mine = fTextDesc(f).filter((t) => pairs.has(t));
    if (!mine.length) continue;
    const start =
      mine.length > 1 ? lca(mine.map((t) => pairs.get(t))) : pairs.get(mine[0]);
    if (!start) continue;
    // 시작점에 이미 f 밖의 글자가 들어 있으면 구현 구조가 달라 짝지을 수 없다
    const clean = (a) =>
      (matchedUnder.get(a) || []).every((r) => isInside(textOf.get(r), f));
    if (!clean(start)) continue;
    const chain = [];
    for (let a = start; a && clean(a); a = iParent(a)) chain.push(a);
    // 글자 하나만 감싼 컨테이너는 글자 요소 자신보다 위에서 고른다(글자 요소가 padding 을 가진 경우는 예외로 둔다)
    const sizeGap = (r) => Math.abs(r.w - f.box[2]) + Math.abs(r.h - f.box[3]);
    const best = chain.reduce(
      (b, r) => (sizeGap(r) < sizeGap(b) ? r : b),
      chain[0],
    );
    containerPairs.set(f, best);
  }
  // 짝 조상 기준으로 시안 상자를 구현 좌표에 옮긴 것(선 비교용)
  const pairedAncestor = (f) => {
    for (let a = f.parent; a; a = a.parent) if (containerPairs.has(a)) return a;
    return fRoot;
  };
  const localBox = (f, anc = pairedAncestor(f)) => {
    const r = containerPairs.get(anc);
    return [
      f.box[0] - anc.box[0] + r.x,
      f.box[1] - anc.box[1] + r.y,
      f.box[2],
      f.box[3],
    ];
  };

  // ── 차이 기록 ───────────────────────────────────────────────
  const diffs = [];
  // 보고서 캡처 위 표시용 상자: 시안은 프레임 기준, 구현은 화면(viewport) 기준
  const [rox, roy] = spec.rootOffset || [0, 0];
  const [iox, ioy] = impl.origin || [0, 0];
  const fBoxOf = (f) =>
    f
      ? [round1(f.box[0] + rox), round1(f.box[1] + roy), f.box[2], f.box[3]]
      : undefined;
  const iBoxOf = (r) =>
    r
      ? [round1(r.x + iox), round1(r.y + ioy), round1(r.w), round1(r.h)]
      : undefined;
  // 차이가 난 노드가 속한 Figma 컴포넌트(가장 가까운 인스턴스). 화면을 가로질러 같은 원인을 묶는 데 쓴다.
  const componentOf = (n) => {
    for (let a = n; a; a = a.parent)
      if (a.component) return a.component.split(" : ")[0];
    return undefined;
  };
  const add = (f, r, prop, figma, implValue, note) =>
    diffs.push({
      component: componentOf(f),
      figmaId: f.id,
      name: f.name,
      label: (f.type === "TEXT" ? f.text.chars : r?.label || f.name).slice(
        0,
        30,
      ),
      prop,
      figma,
      impl: implValue,
      note,
      fBox: fBoxOf(f),
      iBox: iBoxOf(r),
    });

  // 글자
  for (const [f, r] of pairs) {
    const [size, weight, lh] = r.font.split("/");
    const t = f.text;
    const style = t.style ? ` (${t.style})` : "";
    if (!near(t.size, +size, 0.1)) add(f, r, "글자 크기", t.size, +size, style);
    if (+weight !== t.weight) add(f, r, "굵기", t.weight, +weight, style);
    if (t.lh !== "auto" && lh !== "normal" && !near(t.lh, +lh, 0.5))
      add(f, r, "행간", t.lh, +lh, style);
    const ls = r.ls ? parseFloat(r.ls) : 0;
    if (!near(t.ls, ls, 0.05)) add(f, r, "자간", t.ls, ls, style);
    const fc = fPaint(t.color),
      ic = iPaint(r.color);
    if (fc && ic && !(sameRgb(fc, ic) && Math.abs(fc.a - ic.a) <= 0.02))
      add(f, r, "글자 색", showPaint(fc, t.color.var), showPaint(ic));
  }

  // 컨테이너
  const radiusOf = (v) =>
    v === undefined ? 0 : Array.isArray(v) ? Math.max(...v) : v;
  const iRadius = (r) =>
    r.radius ? Math.max(...r.radius.split(/\s+/).map(parseFloat)) : 0;
  // 구현에 대응하는 감싸는 요소가 없어 글자 요소와 짝지어진 시안 컨테이너. 크기·여백은 비교할 상대가 없다.
  const area = (w, h) => Math.max(0, w) * Math.max(0, h);
  const coveredByChild = (f, r) =>
    f.kids.some(
      (k) =>
        fOwnBg(k) &&
        area(k.box[2], k.box[3]) >= 0.95 * area(f.box[2], f.box[3]),
    ) ||
    rows.some(
      (c) =>
        iParent(c) === r && c.bg && area(c.w, c.h) >= 0.95 * area(r.w, r.h),
    );
  const collapsed = (f) => {
    const r = containerPairs.get(f);
    // 글자를 직접 담으면서 padding·배경·테두리를 가진 요소(표 셀 등)는 진짜 컨테이너로 본다
    return f.type !== "TEXT" && usedRows.has(r) && !r.pad && !r.bg && !r.border;
  };
  // 컨테이너 → 첫 글자까지 거리(화면 결과). padding 을 어느 층에 줬는지와 상관없이 글자가 같은 자리에 있으면 같다.
  const firstText = (f) => fTextDesc(f).find((t) => pairs.has(t));
  for (const [f, r] of containerPairs) {
    // 배경: 어느 한쪽이 배경을 칠한 곳만, 실제로 보이는 색으로 비교. 자식이 상자를 거의 다 덮으면 보이는 건 자식
    // 배경이라 바깥 상자는 비교하지 않는다(배경을 thead·tr·th 중 어디에 칠했는지 차이)
    if ((fOwnBg(f) || r.bg) && !coveredByChild(f, r)) {
      const fv = fVisibleBg(f),
        iv = iVisibleBg(r);
      if (!sameRgb(fv, iv))
        add(
          f,
          r,
          "배경(보이는 색)",
          showPaint(fv, f.fill?.var),
          showPaint(iv),
          r.bg ? `구현 bg ${r.bg}` : "구현은 조상 배경",
        );
    }
    // radius 는 배경이 바깥과 달라 보이거나 테두리·그림자가 있을 때만 화면에 드러난다
    const fr = radiusOf(f.radius),
      ir = iRadius(r);
    const fShape =
      (fOwnBg(f) &&
        f.parent &&
        !sameRgb(fVisibleBg(f), fVisibleBg(f.parent))) ||
      f.stroke ||
      f.effects?.length;
    const iShape =
      (r.bg && iParent(r) && !sameRgb(iVisibleBg(r), iVisibleBg(iParent(r)))) ||
      r.border ||
      r.shadow;
    if ((fShape || iShape) && !near(fr, ir)) add(f, r, "radius", fr, ir);
    if ((f.opacity ?? 1) !== +(r.opacity ?? 1))
      add(f, r, "불투명도", f.opacity ?? 1, +(r.opacity ?? 1));
    if (f.effects?.length && !r.shadow)
      add(f, r, "그림자", f.effects.map((e) => e.type).join(","), "없음");
    if (!f.effects?.length && r.shadow && f !== fRoot)
      add(f, r, "그림자", "없음", r.shadow);

    if (collapsed(f)) continue;
    if (f.sizing?.[0] === "FIXED" && !near(f.box[2], r.w))
      add(f, r, "폭(고정)", f.box[2], round1(r.w));
    if (f.sizing?.[1] === "FIXED" && !near(f.box[3], r.h))
      add(f, r, "높이(고정)", f.box[3], round1(r.h));

    // 결과 간격
    if (!f.layout) continue;
    const kidRow = (k) => (pairs.has(k) ? pairs.get(k) : containerPairs.get(k));
    const kidBox = (k, row) => (k.type === "TEXT" ? iContent(row) : row);
    const kids = f.kids
      .filter((k) => !k.absolute)
      .map((k) => ({ f: k, r: kidRow(k) }))
      .filter((k) => k.r)
      .map((k) => ({ ...k, b: kidBox(k.f, k.r) }));
    if (!kids.length) continue;
    // 컨테이너 시작 → 첫 자식. 구현에서 자식과 컨테이너가 같은 요소면 그 요소의 padding 을 쓴다.
    const first = kids[0];
    const ft = firstText(f);
    const insetOf = (axis) => {
      const k = axis === "y" ? 1 : 0;
      // 첫 자식 쪽에 짝지어진 글자가 있으면 컨테이너 → 그 글자 거리로 본다(층별 padding 배분 차이를 흡수)
      if (ft && isInside(ft, first.f)) {
        const c = iContent(pairs.get(ft));
        return [
          round1(ft.box[k] - f.box[k]),
          round1((axis === "y" ? c.y : c.x) - (axis === "y" ? r.y : r.x)),
        ];
      }
      const fIn = first.f.box[k] - f.box[k];
      const iIn =
        first.r === r
          ? box4(r.pad)[axis === "y" ? 0 : 3] +
            iBorderW(r)[axis === "y" ? 0 : 3]
          : axis === "y"
            ? first.b.y - r.y
            : first.b.x - r.x;
      return [round1(fIn), round1(iIn)];
    };
    const padNote = (side) => {
      const idx = { Top: 0, Left: 3 }[side];
      const v = f.vars?.[`padding${side}`];
      return `padding-${side.toLowerCase()} ${f.layout.pad[idx]}${v ? ` (${v})` : ""}`;
    };
    if (f.layout.dir === "col" || f.layout.cross === "MIN") {
      const [a, b] = insetOf("y");
      if (!near(a, b))
        add(f, r, "위쪽 여백(첫 자식까지)", a, b, padNote("Top"));
    }
    if (
      (f.layout.dir === "row" && f.layout.main === "MIN") ||
      (f.layout.dir === "col" && f.layout.cross === "MIN")
    ) {
      const [a, b] = insetOf("x");
      if (!near(a, b))
        add(f, r, "왼쪽 여백(첫 자식까지)", a, b, padNote("Left"));
    }
  }

  // 자식 사이 간격: 시안 컨테이너가 구현에 없어도(구현이 감싸는 요소 없이 부모에 바로 둔 경우) 자식끼리 거리로 비교한다
  for (const f of fNodes) {
    if (!f.layout || typeof f.layout.gap !== "number") continue;
    const kids = f.kids
      .filter((k) => !k.absolute)
      .map((k) => ({ f: k, r: pairs.get(k) || containerPairs.get(k) }))
      .filter((k) => k.r)
      .map((k) => ({ ...k, b: k.f.type === "TEXT" ? iContent(k.r) : k.r }));
    for (let k = 1; k < kids.length; k++) {
      const a = kids[k - 1],
        b = kids[k];
      if (f.kids.indexOf(b.f) !== f.kids.indexOf(a.f) + 1 || a.r === b.r)
        continue;
      const col = f.layout.dir === "col";
      const fGap = col
        ? b.f.box[1] - (a.f.box[1] + a.f.box[3])
        : b.f.box[0] - (a.f.box[0] + a.f.box[2]);
      const iGap = col ? b.b.y - (a.b.y + a.b.h) : b.b.x - (a.b.x + a.b.w);
      // 구현 쪽이 겹치거나 순서가 뒤집혔으면(음수) 배치 구조가 달라 같은 자식 쌍으로 볼 수 없다
      if (iGap < -2 || collapsed(a.f) || collapsed(b.f)) continue;
      if (!near(fGap, iGap)) {
        const v = f.vars?.itemSpacing;
        add(
          f,
          containerPairs.get(f),
          "자식 사이 간격",
          round1(fGap),
          round1(iGap),
          `gap ${f.layout.gap}${v ? ` (${v})` : ""} · ${a.f.name} → ${b.f.name}`,
        );
        break;
      }
    }
  }

  // ── 선(테두리·구분선·밑줄 막대) ───────────────────────────────
  // 시안 stroke 와 구현 border 를 화면 선분으로 바꿔, 어느 요소에 그렸는지와 상관없이 같은 자리에 같은 색 선이 있는지 본다.
  // 12px 미만 선은 아이콘·장식이라 뺀다. 같은 자리에 겹친 선(시안에서 두 번 그린 것)은 하나로 친다.
  const segments = (list) => {
    const seen = new Set();
    return list.filter((s) => {
      const k = `${s.d}|${Math.round(s.pos)}|${Math.round(s.from)}|${Math.round(s.len)}`;
      if (s.len < 12 || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };
  const fSegs = segments(
    fNodes.flatMap((n) => {
      const out = [];
      // 짝지어진 노드는 구현 요소의 원점에, 아니면 가장 가까운 짝 조상 기준으로 놓는다
      const pr = containerPairs.get(n);
      const [x, y, w, h] = pr ? [pr.x, pr.y, n.box[2], n.box[3]] : localBox(n);
      if (n.stroke?.hex) {
        const ws = Array.isArray(n.stroke.w)
          ? n.stroke.w
          : [n.stroke.w, n.stroke.w, n.stroke.w, n.stroke.w];
        const shift =
          n.stroke.align === "OUTSIDE"
            ? -1
            : n.stroke.align === "CENTER"
              ? -0.5
              : 0;
        const c = fPaint(n.stroke);
        if (ws[0])
          out.push({
            d: "h",
            pos: y + shift * ws[0],
            from: x,
            len: w,
            c,
            w: ws[0],
            n,
          });
        if (ws[2])
          out.push({
            d: "h",
            pos: y + h - ws[2] - shift * ws[2],
            from: x,
            len: w,
            c,
            w: ws[2],
            n,
          });
        if (ws[3])
          out.push({
            d: "v",
            pos: x + shift * ws[3],
            from: y,
            len: h,
            c,
            w: ws[3],
            n,
          });
        if (ws[1])
          out.push({
            d: "v",
            pos: x + w - ws[1] - shift * ws[1],
            from: y,
            len: h,
            c,
            w: ws[1],
            n,
          });
      }
      // 얇은 사각형·선 노드도 선으로 본다
      if (!n.kids.length && fOwnBg(n) && (h <= 3 || w <= 3))
        out.push(
          h <= 3
            ? { d: "h", pos: y, from: x, len: w, c: fPaint(n.fill), w: h, n }
            : { d: "v", pos: x, from: y, len: h, c: fPaint(n.fill), w, n },
        );
      return out;
    }),
  );
  const iSegs = segments(
    rows.flatMap((r) => {
      const out = [];
      if (r.border) {
        const [bt, br, bb, bl] = iBorderW(r);
        const c = iPaint(r.border.split(" ").pop());
        if (c) {
          if (bt)
            out.push({ d: "h", pos: r.y, from: r.x, len: r.w, c, w: bt, r });
          if (bb)
            out.push({
              d: "h",
              pos: r.y + r.h - bb,
              from: r.x,
              len: r.w,
              c,
              w: bb,
              r,
            });
          if (bl)
            out.push({ d: "v", pos: r.x, from: r.y, len: r.h, c, w: bl, r });
          if (br)
            out.push({
              d: "v",
              pos: r.x + r.w - br,
              from: r.y,
              len: r.h,
              c,
              w: br,
              r,
            });
        }
      }
      const c = iPaint(r.bg);
      if (c && !r.label && (r.h <= 3 || r.w <= 3))
        out.push(
          r.h <= 3
            ? { d: "h", pos: r.y, from: r.x, len: r.w, c, w: r.h, r }
            : { d: "v", pos: r.x, from: r.y, len: r.h, c, w: r.w, r },
        );
      return out;
    }),
  );
  const covers = (a, b) => {
    const overlap =
      Math.min(a.from + a.len, b.from + b.len) - Math.max(a.from, b.from);
    // 위치가 몇 px 어긋난 것은 상자 크기 차이(따로 보고됨) 때문이므로 같은 선으로 본다
    return (
      a.d === b.d &&
      near(a.pos, b.pos, 4) &&
      overlap >= Math.min(a.len, b.len) * 0.8
    );
  };
  const lineGroups = new Map();
  const addLine = (key, item) => {
    if (!lineGroups.has(key)) lineGroups.set(key, { ...item, n: 0 });
    lineGroups.get(key).n++;
  };
  // 같은 방향·색의 선이 같은 범위를 덮으며 다른 위치에 있으면 행 높이·행 수(데이터) 차이로 보고 뺀다
  const spans = (outer, inner) =>
    outer.from <= inner.from + 2 &&
    outer.from + outer.len >= inner.from + inner.len - 2;
  for (const s of fSegs) {
    const hits = iSegs.filter((t) => covers(s, t));
    const hit = hits.find((t) => sameRgb(s.c, t.c)) || hits[0];
    if (
      !hit &&
      iSegs.some((t) => t.d === s.d && sameRgb(s.c, t.c) && spans(t, s))
    )
      continue;
    const name = s.n.stroke?.var || s.n.fill?.var;
    const label = s.n.name;
    if (!hit)
      addLine(`f|${s.n.id}`, {
        component: componentOf(s.n),
        prop: "선(시안에만)",
        figma: `${s.w}px ${showPaint(s.c, name)}`,
        impl: "없음",
        label,
        note: `${round1(s.n.box[2])}×${round1(s.n.box[3])}`,
        fBox: fBoxOf(s.n),
      });
    else if (!sameRgb(s.c, hit.c) || !near(s.w, hit.w, 0.5))
      addLine(`d|${s.n.id}`, {
        component: componentOf(s.n),
        prop: "선",
        figma: `${s.w}px ${showPaint(s.c, name)}`,
        impl: `${hit.w}px ${showPaint(hit.c)}`,
        label,
        fBox: fBoxOf(s.n),
        iBox: iBoxOf(hit.r),
      });
  }
  const samePattern = (s, t) =>
    s.d === t.d &&
    near(s.len, t.len, 2) &&
    near(s.w, t.w, 0.5) &&
    sameRgb(s.c, t.c);
  for (const t of iSegs) {
    if (fSegs.some((s) => covers(s, t)) || fSegs.some((s) => samePattern(s, t)))
      continue;
    const r = t.r;
    // 한 요소의 여러 변은 한 건으로 친다
    addLine(`i|${r.i}`, {
      prop: "선(구현에만)",
      figma: "없음",
      impl: `${t.w}px ${showPaint(t.c)}`,
      label: `${r.tag} ${r.label || r.slot || ""}`.trim(),
      note: `${round1(r.w)}×${round1(r.h)}`,
      iBox: iBoxOf(r),
    });
  }
  for (const g of lineGroups.values()) diffs.push(g);

  // 높이 차이(단서)
  const clues = [];
  for (const [f, r] of containerPairs)
    if (f.sizing?.[1] !== "FIXED" && !near(f.box[3], r.h, 2))
      clues.push(`${f.name} ${f.box[3]}→${round1(r.h)}`);

  const unmatchedFigma = fTexts
    .filter((t) => !pairs.has(t))
    .map((t) => norm(t.text.chars).slice(0, 24));
  const unmatchedImpl = iTexts
    .filter((r) => !usedRows.has(r))
    .map((r) => norm(r.label).slice(0, 24));

  // 같은 차이(항목·시안 값·구현 값이 같은 것)는 한 후보로 묶고 번호를 붙인다. 에이전트는 이 번호로 판정한다.
  const groups = new Map();
  for (const d of diffs) {
    const k = `${d.prop}|${d.figma}|${d.impl}`;
    if (!groups.has(k))
      groups.set(k, {
        component: d.component,
        prop: d.prop,
        figma: d.figma,
        impl: d.impl,
        note: d.note,
        count: 0,
        labels: [],
        items: [],
      });
    const g = groups.get(k);
    g.count += d.n || 1;
    if (g.labels.length < 3 && !g.labels.includes(d.label))
      g.labels.push(d.label);
    g.items.push({
      figmaId: d.figmaId,
      label: d.label,
      fBox: d.fBox,
      iBox: d.iBox,
    });
  }
  const candidates = [...groups.values()].map((g, i) => ({
    id: `c${i + 1}`,
    ...g,
  }));

  return {
    figma: {
      frame: spec.frame,
      version: spec.version,
      lastModified: spec.lastModified,
    },
    url: impl.url,
    matched: {
      texts: pairs.size,
      of: fTexts.length,
      containers: containerPairs.size,
    },
    candidates,
    clues,
    unmatchedFigma,
    unmatchedImpl,
  };
}

// 화면을 가로질러 같은 차이(같은 컴포넌트·항목·시안 값·구현 값)를 묶는다. 2화면 이상이면 공통 후보(gN)가 된다.
// 컴포넌트가 없으면(일반 프레임) 요소 이름으로 묶는다. results: { 화면 id: compareScreen 결과 }
export function groupAcrossScreens(results) {
  const byKey = new Map();
  for (const [screen, r] of Object.entries(results))
    for (const c of r.candidates) {
      const owner = c.component || c.labels[0] || "";
      const k = `${owner}|${c.prop}|${c.figma}|${c.impl}`;
      if (!byKey.has(k))
        byKey.set(k, {
          owner,
          prop: c.prop,
          figma: c.figma,
          impl: c.impl,
          note: c.note,
          members: [],
        });
      byKey.get(k).members.push({ screen, id: c.id });
    }
  const groups = [...byKey.values()]
    .filter((g) => new Set(g.members.map((m) => m.screen)).size > 1)
    .sort((a, b) => b.members.length - a.members.length)
    .map((g, i) => ({ id: `g${i + 1}`, ...g }));
  const memberOf = new Map();
  for (const g of groups)
    for (const m of g.members) memberOf.set(`${m.screen}|${m.id}`, g.id);
  return { groups, memberOf };
}

export function formatGroups(groups) {
  if (!groups.length) return "";
  const out = [
    `[공통] 2화면 이상에서 같은 차이 ${groups.length}건 — 여기서 한 번 판정하면 모든 화면에 적용`,
  ];
  for (const g of groups)
    out.push(
      `  ${g.id} [${g.owner}] ${g.prop}: 시안 ${g.figma} / 구현 ${g.impl}  ${g.members.length}화면(${g.members.map((m) => `${m.screen}-${m.id}`).join(" ")})${g.note ? "  " + g.note : ""}`,
    );
  return out.join("\n");
}

// 에이전트가 읽는 요약. 짧게 유지한다. memberOf 가 있으면 공통 후보에 속한 것은 번호만 남긴다.
export function formatResult(id, r, memberOf = new Map()) {
  const out = [
    `[${id}] ${r.figma.frame.name} ↔ ${r.url}  글자 짝 ${r.matched.texts}/${r.matched.of}, 컨테이너 짝 ${r.matched.containers}, 후보 ${r.candidates.length}`,
  ];
  const shared = r.candidates.filter((c) => memberOf.has(`${id}|${c.id}`));
  if (shared.length)
    out.push(
      `  공통: ${shared.map((c) => `${c.id}→${memberOf.get(`${id}|${c.id}`)}`).join(" ")}`,
    );
  for (const c of r.candidates.filter((x) => !memberOf.has(`${id}|${x.id}`)))
    out.push(
      `  ${c.id} ${c.prop}: 시안 ${c.figma} / 구현 ${c.impl}${c.count > 1 ? ` ×${c.count}` : ""}  [${c.labels.join(", ")}]${c.note ? "  " + c.note : ""}`,
    );
  if (r.clues.length)
    out.push(
      `  높이 단서: ${r.clues.slice(0, 6).join("; ")}${r.clues.length > 6 ? ` 외 ${r.clues.length - 6}` : ""}`,
    );
  if (r.unmatchedFigma.length)
    out.push(
      `  시안에만 있는 글자 ${r.unmatchedFigma.length}: ${r.unmatchedFigma.slice(0, 8).join(" | ")}`,
    );
  if (r.unmatchedImpl.length)
    out.push(
      `  구현에만 있는 글자 ${r.unmatchedImpl.length}: ${r.unmatchedImpl.slice(0, 8).join(" | ")}`,
    );
  return out.join("\n");
}
