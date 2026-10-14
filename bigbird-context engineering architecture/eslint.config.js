// FSD 경계를 린트로 강제하는 ESLint flat config. 이 파일이 FSD 규칙의 집행 원본이다.
// 규칙을 바꿀 때는 .claude/rules/architecture.md 와 이 파일을 함께 고친다.
// 전제: tsconfig.json 에 `@/*` → `./src/*` 별칭이 있어야 경계 규칙이 import 를 분류한다.
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";
import globals from "globals";
import jsxA11y from "eslint-plugin-jsx-a11y";
import perfectionist from "eslint-plugin-perfectionist";
import reactHooks from "eslint-plugin-react-hooks";
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

export default defineConfig([
  // 생성물과 shadcn 원본은 검사하지 않는다. 고치지 않는 파일이다.
  globalIgnores([
    "dist",
    "build",
    "coverage",
    "node_modules",
    "src/shared/api/generated",
    "src/shared/ui",
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
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "separate-type-imports" },
      ],
      // Public API 강제: 다른 슬라이스의 내부 세그먼트(ui/, model/ ...)를 직접 임포트하지 않는다.
      // 슬라이스 내부에서는 상대 경로를 쓰므로 영향이 없다.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/pages/*/*",
                "@/widgets/*/*",
                "@/features/*/*",
                "@/entities/*/*",
              ],
              message:
                "슬라이스는 index.ts(Public API)를 통해서만 임포트한다. 예: '@/entities/user'",
            },
          ],
        },
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

  // 포맷은 Prettier 담당. 충돌하는 ESLint 규칙을 끈다 — 항상 마지막.
  prettier,
]);
