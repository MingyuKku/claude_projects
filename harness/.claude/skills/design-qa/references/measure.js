// 디자인 QA 측정 함수(원본). 사용법은 measure.md.
// 브라우저에서 실행되므로 전역은 globalThis에서 꺼내 씀(ESLint no-undef를 끄지 않기 위해).
(() => {
  const { document, getComputedStyle, Node } = globalThis;
  // MAX: 한 행이 약 60토큰이라 250행이면 응답이 약 15k 토큰. 그보다 크면 구역을 나눠 재는 게 대조하기도 쉬움
  globalThis.__qaMeasure = (ROOT, MAX = 250) => {
    const root = document.querySelector(ROOT);
    if (!root) return { error: `ROOT not found: ${ROOT}` };
    const base = root.getBoundingClientRect();
    const px = (v) => Math.round(parseFloat(v) * 10) / 10;
    const isZero = (v) => !v || v === 'normal' || /^(0(px)?\s*)+$/.test(v);

    // 색을 Figma와 같은 hex(+투명도)로 맞춤. 투명이면 ''.
    // Tailwind v4 투명도 수식어(bg-muted/40)는 color-mix라 계산값이 oklab()으로 나오므로 sRGB로 직접 변환함
    // (캔버스로 읽으면 투명도 반올림 때문에 채널이 1씩 어긋남).
    const toHex = (r, g, b, a) => {
      if (a <= 0) return '';
      const h = '#' + [r, g, b].map((n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')).join('').toUpperCase();
      return a >= 1 ? h : `${h}/${Math.round(a * 100)}%`;
    };
    const num = (v) => (v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v));
    const hex = (c) => {
      if (!c || c === 'transparent') return '';
      const m = c.match(/^(rgba?|oklab|oklch)\(([^)]*)\)/);
      if (!m) return c;
      const [ch, alpha] = m[2].split('/').map((x) => x.trim());
      const v = ch.split(/[\s,]+/).map(num);
      const a = alpha !== undefined ? num(alpha) : v[3] ?? 1;
      if (m[1].startsWith('rgb')) return toHex(v[0], v[1], v[2], a);
      // Tailwind v4 기본 팔레트(bg-blue-200 등)는 oklch. 극좌표(C·h)를 oklab(a·b)로 바꿔 같은 식으로 변환
      const [L, A, B] = m[1] === 'oklch' ? [v[0], v[1] * Math.cos((v[2] * Math.PI) / 180), v[1] * Math.sin((v[2] * Math.PI) / 180)] : v;
      const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
      const mm = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
      const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
      const gam = (x) => 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
      return toHex(
        gam(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s),
        gam(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s),
        gam(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s),
        a,
      );
    };
    const box4 = (s, p) => ['Top', 'Right', 'Bottom', 'Left'].map((d) => px(s[`${p}${d}`])).join(' ');
    // Tailwind의 투명 ring·shadow 층을 걷어내고 보이는 그림자만 남김
    const shadow = (v) =>
      v === 'none'
        ? ''
        : v
            .split(/,(?![^(]*\))/)
            .map((x) => x.trim())
            .filter((x) => hex(x.match(/^(rgba?|oklab|oklch)\([^)]*\)/)?.[0] ?? '#000'))
            .join(', ');
    const ownText = (el) =>
      [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent.trim()).join(' ').trim();
    const fileName = (src) => (src || '').split('?')[0].split('/').pop();

    const rows = [];
    // 대조 스크립트가 짝을 짓도록 행 번호(i)와 가장 가까운 측정된 조상의 번호(p)를 남김
    const index = new Map();
    const parentRow = (el) => {
      for (let a = el.parentElement; a && a !== root.parentElement; a = a.parentElement) if (index.has(a)) return index.get(a);
      return undefined;
    };
    for (const el of [root, ...root.querySelectorAll('*')]) {
      if (rows.length >= MAX) break;
      const r = el.getBoundingClientRect();
      // 크기 0, 또는 화면에 안 보이는 접근성용 1px 요소(sr-only·Radix 숨김 select)는 뺌
      if (r.width <= 1 || r.height <= 1) continue;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none' || s.opacity === '0') continue;

      const text = ownText(el);
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role');
      const interactive = /^(button|a|input|select|textarea|svg|img)$/.test(tag) || role;
      const bg = hex(s.backgroundColor);
      const hasBg = bg || s.backgroundImage !== 'none';
      const hasBorder = s.borderStyle !== 'none' && !isZero(s.borderWidth) && hex(s.borderColor);
      const sh = shadow(s.boxShadow);
      const hasShape = hasBg || hasBorder || !isZero(s.borderRadius) || sh;
      // padding 이 있으면 표 셀(table-cell)처럼 flex·grid 가 아니어도 간격을 만드는 요소라 남김
      const isLayout = !isZero(s.padding) || (/flex|grid/.test(s.display) && !isZero(s.gap));
      // 측정 구역 자체는 항상 남김(대조의 원점)
      if (el !== root && !text && !interactive && !hasShape && !isLayout) continue;

      const row = {
        i: rows.length,
        p: parentRow(el),
        tag: tag + (role ? `[${role}]` : ''),
        label: (text || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').slice(0, 80),
        x: px(r.left - base.left),
        y: px(r.top - base.top),
        w: px(r.width),
        h: px(r.height),
      };
      if (text || /^(input|textarea|select)$/.test(tag)) {
        row.font = `${px(s.fontSize)}/${s.fontWeight}/${s.lineHeight === 'normal' ? 'normal' : px(s.lineHeight)}`;
        if (s.letterSpacing !== 'normal') row.ls = s.letterSpacing;
        row.color = hex(s.color);
        if (s.webkitLineClamp !== 'none') row.clamp = `line-clamp ${s.webkitLineClamp}`;
        else if (s.textOverflow === 'ellipsis') row.clamp = 'ellipsis';
      }
      if (hasBg) row.bg = bg || s.backgroundImage.slice(0, 60);
      if (hasBorder) row.border = `${s.borderWidth} ${s.borderStyle} ${hex(s.borderColor)}`;
      if (!isZero(s.borderRadius)) row.radius = s.borderRadius;
      if (sh) row.shadow = sh;
      if (!isZero(s.padding)) row.pad = box4(s, 'padding');
      if (/flex|grid/.test(s.display)) {
        row.layout = `${s.display} ${s.flexDirection} ${s.alignItems} ${s.justifyContent}`;
        if (!isZero(s.gap)) row.gap = s.gap;
      }
      if (s.position === 'sticky' || s.position === 'fixed') row.pos = s.position;
      if (el.dataset.slot) row.slot = el.dataset.slot;
      if (s.opacity !== '1') row.opacity = s.opacity;
      // 아이콘: 대부분 SVG 파일을 <img>로 씀(shared/assets/img), 일부 lucide-react
      // 4KB 미만 SVG는 Vite가 data URI로 넣어 파일 이름이 없음 → 'inline-svg'(모양은 캡처로 비교)
      if (tag === 'img') row.icon = el.getAttribute('src')?.startsWith('data:') ? 'inline-svg' : fileName(el.getAttribute('src'));
      if (tag === 'svg') {
        row.icon = el.getAttribute('class')?.match(/lucide-[\w-]+/)?.[0] ?? 'svg';
        if (s.color) row.color = hex(s.color);
      }
      index.set(el, row.i);
      rows.push(row);
    }
    return {
      root: ROOT,
      viewport: `${globalThis.innerWidth}x${globalThis.innerHeight}`,
      size: `${px(base.width)}x${px(base.height)}`,
      // 측정 구역의 화면(viewport) 위치. 보고서 캡처 위에 차이 위치를 그릴 때 더함
      origin: [px(base.left), px(base.top)],
      scroll: root.scrollHeight > root.clientHeight + 1 ? `${root.clientHeight}/${root.scrollHeight}` : undefined,
      count: rows.length,
      truncated: rows.length >= MAX,
      rows,
    };
  };
  // 헤드리스 스크롤바(15px)가 측정값을 흩트려서 숨김(실기기는 overlay 스크롤바).
  // 초기화 스크립트로 넣으면 <head>가 생기기 전에 실행되므로 DOM이 준비된 뒤 넣음
  const hideScrollbar = () => {
    if (document.getElementById('qa-no-scrollbar')) return;
    const st = document.createElement('style');
    st.id = 'qa-no-scrollbar';
    st.textContent = '*{scrollbar-width:none!important}*::-webkit-scrollbar{display:none!important}';
    (document.head || document.documentElement).appendChild(st);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hideScrollbar);
  else hideScrollbar();
  // 설치만 함. 측정은 구역을 정해 따로 부름(화면마다 <main>이 없을 수도 있음)
  return { installed: true, main: !!document.querySelector('main') };
})();
