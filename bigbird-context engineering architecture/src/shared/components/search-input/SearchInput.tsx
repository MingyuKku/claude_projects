import { cva } from "class-variance-authority";
import { Search } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { ComponentProps } from "react";

// Figma 디자인 시스템 Search(2752:9357). Line은 아래 테두리만, Filled는 사방 테두리 + 반경 6.
// Figma에 포커스 링이 없어 커서만 보임.
// iOS(WebKit)는 입력 글자가 16px 미만이면 포커스할 때 화면을 자동 확대하므로 iOS에서만 16px로 키움(Figma는 14px).
// 근거·한계는 shared/components/text-field/styles.ts 주석과 같음(공식 문서 근거 없음, 실기기 동작과 개발 자료에 의존).
const searchInputVariants = cva(
  "flex w-full items-center gap-2 border-border bg-popover px-3 py-2.5 text-foreground",
  {
    variants: {
      variant: {
        line: "border-b",
        filled: "rounded-md border",
      },
    },
    defaultVariants: { variant: "line" },
  },
);

interface SearchInputProps extends Omit<ComponentProps<"input">, "type"> {
  variant?: "line" | "filled";
}

export function SearchInput({
  variant,
  className,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn(searchInputVariants({ variant }), className)}>
      <Search aria-hidden="true" className="size-4 shrink-0" />
      <input
        {...props}
        type="search"
        className="h-5 min-w-0 flex-1 bg-transparent text-sm leading-5 outline-none placeholder:text-foreground/50 disabled:cursor-not-allowed supports-[-webkit-touch-callout:none]:text-base [&::-webkit-search-cancel-button]:hidden"
      />
    </div>
  );
}
