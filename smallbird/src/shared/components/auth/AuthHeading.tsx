import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib";

import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

/**
 * 인증 화면 제목. 회원 Figma 타입 스케일(굵기 700, 행간 150%,
 * 모바일 -> 태블릿 -> 데스크톱으로 커짐)을 씀.
 */

type AuthHeadingType =
  | "headline-1"
  | "headline-2"
  | "headline-3"
  | "subtitle-1"
  | "subtitle-2"
  | "subtitle-3";

type AuthHeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span";

const authHeadingVariants = cva("font-bold", {
  variants: {
    type: {
      "headline-1":
        "text-[24px] tablet:text-[28px] desktop:text-[30px] tracking-[1px]",
      "headline-2":
        "text-[22px] tablet:text-[24px] desktop:text-[26px] tracking-[1px]",
      "headline-3": "text-[20px] tablet:text-[22px] desktop:text-[24px]",
      "subtitle-1": "text-[18px] tablet:text-[20px] desktop:text-[22px]",
      "subtitle-2": "text-[16px] tablet:text-[18px] desktop:text-[20px]",
      "subtitle-3": "text-[16px] tablet:text-[18px] desktop:text-[18px]",
    },
    tone: {
      default: "text-gray-700",
      heading: "text-heading",
    },
  },
  defaultVariants: { type: "headline-1", tone: "default" },
});

/** 시각 크기와 문서 구조는 별개. `as`가 항상 우선함. */
const DEFAULT_TAG: Record<AuthHeadingType, AuthHeadingElement> = {
  "headline-1": "h1",
  "headline-2": "h2",
  "headline-3": "h3",
  "subtitle-1": "h4",
  "subtitle-2": "h5",
  "subtitle-3": "h6",
};

interface AuthHeadingProps
  extends
    Omit<ComponentProps<"h1">, "type">,
    Pick<VariantProps<typeof authHeadingVariants>, "tone"> {
  /** `null`이 들어올 수 없게 유니온을 직접 선언함(기본값 "headline-1"). */
  type?: AuthHeadingType;
  as?: AuthHeadingElement;
}

export function AuthHeading({
  type = "headline-1",
  tone,
  as,
  className,
  children = null,
  ...props
}: AuthHeadingProps) {
  const Component = as ?? DEFAULT_TAG[type];

  return (
    <Component
      className={cn(
        authHeadingVariants({ type, tone }),
        // 행간은 크기 클래스 뒤에 와야 함. 이유는 AuthText와 같음.
        "leading-[1.5]",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
