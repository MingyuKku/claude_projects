// FSD 경계를 린트로 강제하는 ESLint flat config. 이 파일이 FSD 규칙의 집행 원본이다.
// 규칙을 바꿀 때는 .claude/rules/architecture.md 와 이 파일을 함께 고친다.
// 전제: tsconfig.json 에 `@/*` → `./src/*` 별칭이 있어야 경계 규칙이 import 를 분류한다.
import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import prettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";
import jsxA11y from "eslint-plugin-jsx-a11y";
import perfectionist from "eslint-plugin-perfectionist";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

// 레이어별로 임포트 가능한 하위 레이어. 같은 레이어는 "같은 슬라이스"만 허용한다.
// (슬라이스 간 교차 임포트 금지. 불가피한 entities 간 참조는 FSD 의 @x 표기를 쓰고
//  팀 합의 후 이 표에 예외를 추가한다.)
const LAYERS = {
  page: ["widget", "feature", "entity", "shared"],
  widget: ["feature", "entity", "shared"],
  feature: ["entity", "shared"],
  entity: ["shared"],
};

const sameSlicePolicies = Object.keys(LAYERS).map((type) => ({
  from: { element: { type } },
  allow: {
    to: {
      element: {
        type,
        captured: { slice: "{{ from.element.captured.slice }}" },
      },
    },
  },
}));

const lowerLayerPolicies = Object.entries(LAYERS).map(([type, lower]) => ({
  from: { element: { type } },
  allow: { to: { element: { type: lower } } },
}));

// Public API 강제: 다른 슬라이스의 내부 세그먼트(ui/, model/ ...)를 직접 임포트하지 않는다.
// 슬라이스 내부에서는 상대 경로를 쓰므로 영향이 없다.
const SLICE_IMPORT_PATTERNS = [
  {
    group: ["@/pages/*/*", "@/widgets/*/*", "@/features/*/*", "@/entities/*/*"],
    message:
      "슬라이스는 index.ts(Public API)를 통해서만 임포트한다. 예: '@/entities/user'",
  },
];

// Firebase SDK는 src/shared/api/firebase.ts 가 감싼다. 초기화·익명 로그인·번들 분리를 한 곳에서 관리하기 위해서다.
const FIREBASE_IMPORT_PATTERNS = [
  {
    regex: "^firebase(/|$)",
    message: "Firebase SDK는 '@/shared/api'의 getFirestoreDb로만 쓴다.",
  },
];

// 다국어 런타임은 src/shared/i18n 이 감싼다. 그 밖에서는 '@/shared/i18n' 을 쓴다.
const I18N_IMPORT_PATHS = ["i18next", "react-i18next"].map((name) => ({
  name,
  message:
    "i18next·react-i18next 는 src/shared/i18n 에서만 임포트한다. '@/shared/i18n' 을 쓴다.",
}));

export default defineConfig([
  // 생성물은 검사하지 않는다. shared/ui는 Figma에 맞게 직접 고치므로 검사한다.
  globalIgnores([
    "dist",
    "build",
    "coverage",
    "node_modules",
    "src/shared/api/generated",
  ]),

  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,

  {
    files: ["scripts/**/*.{js,mjs}", "*.config.{js,ts}"],
    languageOptions: { globals: globals.node },
  },

  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // recommended 가 warn 으로 두는 훅 규칙을 error 로 올린다. 경고는 max-lines 하나만 남겨
      // Claude 훅·pre-commit·CI 가 같은 기준(error 만 차단)으로 판정하게 한다.
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/incompatible-library": "error",
      "react-hooks/unsupported-syntax": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "separate-type-imports" },
      ],
      // Public API 강제(SLICE_IMPORT_PATTERNS)와 i18n 라이브러리 임포트 제한(I18N_IMPORT_PATHS).
      // 같은 규칙을 뒤쪽 블록에서 다시 선언하면 옵션이 통째로 바뀌므로 한 곳에 함께 둔다.
      "no-restricted-imports": [
        "error",
        {
          paths: I18N_IMPORT_PATHS,
          patterns: [...SLICE_IMPORT_PATTERNS, ...FIREBASE_IMPORT_PATTERNS],
        },
      ],
    },
  },

  // Firebase SDK를 직접 다루는 유일한 파일. 옵션 전체를 다시 선언하므로 나머지 제한은 함께 넘긴다.
  {
    files: ["src/shared/api/firebase.ts", "src/shared/api/firebase.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: I18N_IMPORT_PATHS, patterns: SLICE_IMPORT_PATTERNS },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 레이어 경계 — app → pages → widgets → features → entities → shared 단방향.
  // element pattern 은 폴더만 매칭한다 (확장자 금지). 위에서부터 먼저 매칭된 것이 이긴다.
  // ---------------------------------------------------------------------------
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      // `@/*` → `./src/*` 별칭을 풀어준다. 이게 없으면 모든 import 가 unknown 으로
      // 분류돼 정책이 조용히 통과한다.
      "import/resolver": { typescript: { project: "./tsconfig.json" } },
      "boundaries/elements": [
        { type: "app", pattern: "src/app" },
        { type: "page", pattern: "src/pages/*", capture: ["slice"] },
        { type: "widget", pattern: "src/widgets/*", capture: ["slice"] },
        { type: "feature", pattern: "src/features/*", capture: ["slice"] },
        { type: "entity", pattern: "src/entities/*", capture: ["slice"] },
        { type: "shared", pattern: "src/shared" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message:
            "{{ from.element.type }} → {{ to.element.type }} 금지 (FSD). 상위 레이어 역류이거나 같은 레이어의 다른 슬라이스다. 공유가 필요하면 하위 레이어로 내린다.",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: {
                to: {
                  element: {
                    type: [
                      "app",
                      "page",
                      "widget",
                      "feature",
                      "entity",
                      "shared",
                    ],
                  },
                },
              },
            },
            ...lowerLayerPolicies,
            ...sameSlicePolicies,
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { type: "shared" } } },
            },
          ],
        },
      ],
    },
  },

  {
    // import 정렬. 전부 --fix 로 자동 교정되므로 error 로 둔다.
    files: ["src/**/*.{ts,tsx}"],
    plugins: { perfectionist },
    rules: {
      "perfectionist/sort-imports": [
        "error",
        {
          type: "natural",
          newlinesBetween: 1,
          internalPattern: ["^@/.*"],
          groups: [
            ["builtin", "external"],
            "internal",
            ["parent", "sibling", "index"],
            "type",
            "unknown",
          ],
        },
      ],
    },
  },

  {
    // src/shared/i18n 만 i18n 라이브러리를 임포트한다. 옵션 전체를 다시 선언하므로 patterns 를 함께 넘긴다.
    files: ["src/shared/i18n/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [...SLICE_IMPORT_PATTERNS, ...FIREBASE_IMPORT_PATTERNS] },
      ],
    },
  },

  {
    // .claude/rules/code-style.md "타입"·"컴포넌트와 훅". 도구가 default export 를 요구하는 파일이 생기면
    // 그 파일만 아래에 예외 블록을 둔다.
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSEnumDeclaration",
          message: "enum 대신 문자열 리터럴 유니온이나 as const 객체를 쓴다.",
        },
        {
          selector: "ExportDefaultDeclaration",
          message: "default export 대신 named export 를 쓴다.",
        },
        {
          selector: "ExportSpecifier[exported.name='default']",
          message: "default export 대신 named export 를 쓴다.",
        },
      ],
    },
  },

  {
    // 파일 크기 점검 신호(.claude/rules/react-components.md "책임과 크기"). 병합을 막지 않도록 warn.
    // 300은 ESLint 기본값이다. 경고가 난 파일이 책임 과다가 아니라는 판단이 반복되면 올리고, 300 아래에서도 책임이 섞인 파일이 반복되면 내린다.
    // shadcn 원본(shared/ui), 테스트, 미리보기 화면, 문구·데이터만 담은 파일은 크기가 책임과 무관해 제외한다.
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/shared/ui/**",
      "src/**/*.test.{ts,tsx}",
      "src/pages/ui-preview/**",
      "src/entities/terms/model/content/**",
      "src/pages/introduction/model/data.ts",
    ],
    rules: {
      "max-lines": [
        "warn",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
    },
  },

  {
    // 함수 선언 앞뒤 빈 줄(.claude/rules/code-style.md "본문 순서"). Prettier가 빈 줄을 넣지 않아 --fix로 교정한다.
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "@stylistic": stylistic },
    rules: {
      "@stylistic/padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "function" },
        { blankLine: "always", prev: "function", next: "*" },
      ],
    },
  },

  {
    // TanStack Table의 useReactTable은 React Compiler가 메모이제이션할 수 없다는 경고.
    // 프로젝트는 React Compiler를 쓰지 않아 실제 문제가 없으므로 DataTable만 끈다. 컴파일러 도입 시 재검토.
    files: ["src/shared/components/data-table/**/*.{ts,tsx}"],
    rules: { "react-hooks/incompatible-library": "off" },
  },

  // 포맷은 Prettier 담당. 충돌하는 ESLint 규칙을 끈다 — 항상 마지막.
  prettier,
]);
