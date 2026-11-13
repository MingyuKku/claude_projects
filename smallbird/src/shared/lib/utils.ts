import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Figma 디자인 시스템 토큰(ds-*, src/app/styles/ds-tokens.css)을 tailwind-merge 에 알린다.
// 등록하지 않으면 `cn("gap-4", "ds-gap-6")` 이 둘 다 남아 CSS 순서로 결과가 정해진다.
const isDsStep = (value: string) => /^(\d+(\.\d+)?|px)$/.test(value);
const isDsTextStyle = (value: string) =>
  /^[a-z0-9]+-[a-z0-9]+-[a-z]+$/.test(value);

// ds- 간격은 같은 이름의 Tailwind 그룹과 같은 범위를 덮는다. [ds 그룹, Tailwind 그룹, 함께 덮는 하위 그룹]
const DS_SPACING: [string, string, string[]][] = [
  ["ds-gap", "gap", ["gap-x", "gap-y"]],
  ["ds-gap-x", "gap-x", []],
  ["ds-gap-y", "gap-y", []],
  ["ds-p", "p", ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"]],
  ["ds-px", "px", ["ps", "pe", "pr", "pl"]],
  ["ds-py", "py", ["pt", "pb"]],
  ["ds-pt", "pt", []],
  ["ds-pr", "pr", []],
  ["ds-pb", "pb", []],
  ["ds-pl", "pl", []],
];
const DS_GROUPS = new Set(DS_SPACING.map(([group]) => group));
const dsOf = (children: string[]) =>
  children.map((c) => `ds-${c}`).filter((g) => DS_GROUPS.has(g));

const twMerge = extendTailwindMerge<string>({
  extend: {
    classGroups: {
      ...Object.fromEntries(
        DS_SPACING.map(([group]) => [group, [{ [group]: [isDsStep] }]]),
      ),
      "ds-text": [{ "ds-text": [isDsTextStyle] }],
      "ds-shadow": [
        "ds-shadow",
        { "ds-shadow": ["sm", "md", "lg", "xl", "2xl", "inner"] },
      ],
    },
    conflictingClassGroups: {
      ...Object.fromEntries(
        DS_SPACING.flatMap(([group, base, children]) => [
          [group, [base, ...children, ...dsOf(children)]],
          [base, [group, ...dsOf(children)]],
        ]),
      ),
      // 텍스트 스타일은 크기·행간·굵기·자간 묶음이라 앞의 개별 클래스를 지운다. 반대 방향은 두지 않는다:
      // 뒤에 온 개별 클래스 하나 때문에 묶음 전체가 지워지면 크기·굵기까지 사라지기 때문이다.
      "ds-text": ["font-size", "leading", "font-weight", "tracking"],
      "ds-shadow": ["shadow"],
      shadow: ["ds-shadow"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
