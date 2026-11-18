import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib";

import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

/**
 * 인증 화면 본문 텍스트. 상품 디자인 시스템이 아니라 회원 Figma 타입 스케일을
 * 씀. 이 화면들은 시안대로 QA를 통과했으므로 값은 그대로 둠.
 */

const authTextVariants = cva("", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-sm desktop:text-base",
      lg: "text-sm tablet:text-base desktop:text-lg",
      xl: "text-base tablet:text-lg desktop:text-xl",
      // 화면 너비와 상관없이 크기가 고정되는 변형(팝업·버튼 안 글자)
      "fixed-base": "text-base",
      "fixed-xl": "text-xl",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      bold: "font-bold",
    },
    tone: {
      default: "text-gray-700",
      heading: "text-heading",
      // 버튼처럼 부모가 정한 글자색을 그대로 따를 때
      inherit: "text-inherit",
      negative: "text-negative",
      positive: "text-positive",
      muted: "text-gray-500",
      light: "text-light",
      faint: "text-gray-400",
      lined: "text-icon-lined",
    },
  },
  defaultVariants: { size: "md", weight: "normal", tone: "default" },
});

interface AuthTextProps
  extends ComponentProps<"p">, VariantProps<typeof authTextVariants> {
  as?: "p" | "span";
  /** 필수 입력 표시(*)를 뒤에 붙임. */
  isRequired?: boolean;
}

export function AuthText({
  as: Component = "p",
  size,
  weight,
  tone,
  className,
  children = null,
  isRequired = false,
  ...props
}: AuthTextProps) {
  return (
    <Component
      className={cn(
        authTextVariants({ size, weight, tone }),
        // 행간은 크기 클래스 뒤에 와야 함. tailwind-merge가 text-{size}와
        // leading을 충돌로 보고 앞에 온 leading을 지우기 때문.
        "leading-normal",
        className,
      )}
      {...props}
    >
      {children}
      {isRequired && <span className="pl-1 text-negative">*</span>}
    </Component>
  );
}
