// Figma 디자인 시스템 토큰(ds-*) CSS 생성과 검사. 의존성 없이 Node 만으로 동작합니다.
//   node scripts/design/tokens.mjs          → src/app/styles/ds-tokens.css 생성 (pnpm ds:tokens)
//   node scripts/design/tokens.mjs --check  → 생성 파일이 최신인지 검사 (pnpm ds:tokens:check)
// 입력은 같은 폴더의 figma-design-system.json(Figma 변수·스타일 스냅샷, 시안 수집 figma.mjs 와 같이 씀)입니다.
//
// Figma 디자인 시스템은 Tailwind 이름(gap-6, text-sm/leading-5/medium)을 쓰지만 값이 기기(PC·tablet·mobile)마다
// 다르고, 텍스트 스타일은 크기·행간·굵기·자간 묶음입니다. 같은 이름의 Tailwind 기본 클래스와 뜻이 다르므로
// ds- 접두어로 따로 만듭니다. 모바일 값을 기본으로 두고 tablet(768)·desktop(1440) 구간에서 바뀐 값만 덮습니다.
import { readFileSync, writeFileSync } from "node:fs";

const INPUT = "scripts/design/figma-design-system.json";
const OUTPUT = "src/app/styles/ds-tokens.css";

const tokens = JSON.parse(readFileSync(INPUT, "utf8"));
const MODE_INDEX = Object.fromEntries(tokens.modes.map((mode, i) => [mode, i]));
// 모바일 우선: 기본값 → tablet → desktop 순으로 덮는다.
const LAYERS = [
  { variant: null, mode: "mobile" },
  { variant: "tablet", mode: "tablet" },
  { variant: "desktop", mode: "PC" },
];

const rem = (px) => (px === 0 ? "0" : `${+(px / 16).toFixed(4)}rem`);
// 테마 키에는 점을 쓸 수 없어 Tailwind 관례대로 밑줄로 바꾼다(ds-gap-0.5 → --ds-gap-0_5).
const key = (step) => step.replaceAll(".", "_");

// 테마 변수 목록: [변수 이름, [PC, tablet, mobile] px]
const scales = [
  ...Object.entries(tokens.gap).map(([s, v]) => [`--ds-gap-${key(s)}`, v]),
  ...Object.entries(tokens.padding).map(([s, v]) => [`--ds-p-${key(s)}`, v]),
  ...Object.entries(tokens.fontSize).map(([s, v]) => [`--ds-text-${s}`, v]),
  ...Object.entries(tokens.lineHeight).map(([s, v]) => [
    `--ds-leading-${s}`,
    v,
  ]),
];

function themeBlock() {
  const base = scales.map(
    ([name, v]) => `  ${name}: ${rem(v[MODE_INDEX.mobile])};`,
  );
  const overrides = [];
  for (let i = 1; i < LAYERS.length; i++) {
    const { variant, mode } = LAYERS[i];
    const prev = LAYERS[i - 1].mode;
    const changed = scales
      .filter(([, v]) => v[MODE_INDEX[mode]] !== v[MODE_INDEX[prev]])
      .map(([name, v]) => `      ${name}: ${rem(v[MODE_INDEX[mode]])};`);
    if (changed.length)
      overrides.push(`    @variant ${variant} {\n${changed.join("\n")}\n    }`);
  }
  // 함수형 유틸리티(ds-gap-* 등)가 값을 찾으려면 @theme 키여야 한다. static 은 쓰이지 않은 변수도 남겨
  // 기기별 덮어쓰기와 짝이 어긋나지 않게 한다.
  return [
    `@theme static {\n${base.join("\n")}\n}`,
    `@layer theme {\n  :root {\n${overrides.join("\n")}\n  }\n}`,
  ].join("\n\n");
}

const SPACING_UTILITIES = [
  ["ds-gap", "gap", "gap"],
  ["ds-gap-x", "column-gap", "gap"],
  ["ds-gap-y", "row-gap", "gap"],
  ["ds-p", "padding", "p"],
  ["ds-px", "padding-inline", "p"],
  ["ds-py", "padding-block", "p"],
  ["ds-pt", "padding-top", "p"],
  ["ds-pr", "padding-right", "p"],
  ["ds-pb", "padding-bottom", "p"],
  ["ds-pl", "padding-left", "p"],
];

function spacingUtilities() {
  return SPACING_UTILITIES.map(
    ([name, prop, scale]) =>
      `@utility ${name}-* {\n  ${prop}: --value(--ds-${scale}-*);\n}`,
  ).join("\n");
}

const STYLE_NAME = /^text-([a-z0-9]+)\/leading-([a-z0-9]+)\/([a-z]+)$/;

function letterSpacing(value) {
  if (value === "0") return "0";
  if (value.endsWith("%")) return `${+(parseFloat(value) / 100).toFixed(4)}em`;
  return value;
}

function textStyleUtilities() {
  return Object.entries(tokens.textStyles)
    .map(([name, style]) => {
      const match = STYLE_NAME.exec(name);
      if (!match)
        throw new Error(
          `${INPUT}: 텍스트 스타일 이름 형식이 다릅니다: ${name}`,
        );
      const [, size, leading, weight] = match;
      if (!tokens.fontSize[size])
        throw new Error(`${INPUT}: fontSize.${size} 가 없습니다 (${name})`);
      if (leading !== "none" && !tokens.lineHeight[leading])
        throw new Error(
          `${INPUT}: lineHeight.${leading} 가 없습니다 (${name})`,
        );
      const lineHeight =
        leading === "none" ? "1" : `var(--ds-leading-${leading})`;
      return [
        `/* ${name} */`,
        `@utility ds-text-${size}-${leading}-${weight} {`,
        `  font-size: var(--ds-text-${size});`,
        `  line-height: ${lineHeight};`,
        `  font-weight: ${style.weight};`,
        `  letter-spacing: ${letterSpacing(style.letterSpacing)};`,
        `}`,
      ].join("\n");
    })
    .join("\n");
}

// 그림자가 여러 겹이면 Prettier 처럼 한 겹씩 줄을 나눠, pnpm format 뒤에도 --check 가 통과하게 한다.
function shadowValue(value) {
  const layers = value.split(/,\s*(?![^(]*\))/);
  return layers.length === 1
    ? ` ${value}`
    : `\n${layers.map((layer) => `    ${layer}`).join(",\n")}`;
}

function shadowUtilities() {
  return Object.entries(tokens.shadows)
    .map(
      ([name, value]) =>
        `@utility ds-${name} {\n  box-shadow:${shadowValue(value)};\n}`,
    )
    .join("\n");
}

const css = `/* 생성 파일입니다. 직접 수정하지 않습니다.
   원본: ${INPUT} (Figma ${tokens.source.file}, ${tokens.source.capturedAt})
   생성: pnpm ds:tokens */

${themeBlock()}

/* 간격: Figma gap/padding 변수. 예) ds-gap-6 = PC 24 · tablet 20 · mobile 16 */
${spacingUtilities()}

/* 텍스트 스타일: Figma text-{크기}/leading-{행간}/{굵기} → ds-text-{크기}-{행간}-{굵기} */
${textStyleUtilities()}

/* 그림자: Figma(Tailwind v3) 이름과 값. v4 기본 shadow-* 와 이름이 한 칸씩 어긋나 따로 둔다. */
${shadowUtilities()}
`;

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(OUTPUT, "utf8");
  } catch {
    // 파일이 없으면 아래에서 최신이 아님으로 처리한다.
  }
  if (current !== css) {
    console.error(
      `${OUTPUT} 가 ${INPUT} 와 다릅니다. pnpm ds:tokens 를 실행하세요.`,
    );
    process.exit(1);
  }
} else {
  writeFileSync(OUTPUT, css);
  console.log(`${OUTPUT} 생성`);
}
