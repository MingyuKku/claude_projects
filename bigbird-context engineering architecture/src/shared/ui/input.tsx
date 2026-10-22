import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/shared/lib/utils"

// Figma 디자인 시스템 Input(6918:60663) 필드. inputSize md 40 / sm 36.
// iOS(WebKit)는 입력 글자가 16px 미만이면 포커스할 때 화면을 자동 확대하므로 iOS에서만 16px로 키움(Figma는 14px).
// 근거·한계는 shared/components/text-field/styles.ts 주석과 같음(공식 문서 근거 없음, 실기기 동작과 개발 자료에 의존).
// HTML input의 size 속성과 겹치지 않게 inputSize로 둠.
const inputVariants = cva(
  "w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm leading-5 text-foreground supports-[-webkit-touch-callout:none]:text-base transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 aria-invalid:focus-visible:ring-destructive disabled:pointer-events-none disabled:cursor-not-allowed file:mr-2 file:border-0 file:bg-transparent file:p-0 file:text-sm file:leading-5 file:font-medium file:text-foreground",
  {
    variants: {
      inputSize: {
        md: "h-10 py-2.5",
        sm: "h-9 py-2",
      },
    },
    defaultVariants: { inputSize: "md" },
  }
)

function Input({
  className,
  type,
  inputSize,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ inputSize }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
