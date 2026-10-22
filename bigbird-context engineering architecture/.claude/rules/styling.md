---
paths:
  - "src/**/ui/**/*.tsx"
  - "src/app/layouts/**/*.tsx"
  - "src/**/*.css"
---

# UI 시스템 (shadcn/ui · Tailwind · CVA)

- **배치**: shadcn/ui 컴포넌트는 `src/shared/ui/`에 둡니다. Figma 디자인 시스템이 shadcn 키트를 회사 디자인으로 바꾼 것이므로, Figma와 다른 부분은 래퍼를 만들지 않고 이 폴더의 파일을 직접 고칩니다. 기능 전용 변형은 여기 넣지 않고 상위 컴포넌트에서 감쌉니다.
- **shadcn CLI 재설치 주의**: `shadcn add --overwrite`는 직접 고친 내용을 덮어씁니다. 업데이트가 필요하면 diff를 보고 수동으로 합칩니다. CLI 출력 형식(따옴표·세미콜론)을 유지하기 위해 이 폴더는 Prettier 검사에서만 제외되어 있습니다. 직접 고치는 파일이므로 ESLint(import 정렬·훅·접근성 규칙)는 검사합니다.
- **클래스 병합**: `src/shared/lib/utils.ts`의 `cn`(`clsx` + `tailwind-merge`)만 씁니다.
- **변형**: variant, size 같은 변형은 `cva`로 선언해 타입으로 노출합니다. 문자열 삼항 연산으로 클래스를 조립하지 않습니다.
- **ref**: React 19에서는 `ref`가 일반 prop이므로 `forwardRef`를 쓰지 않습니다.
- **토큰**: 색상·간격은 시맨틱 토큰(`text-foreground`, `bg-primary`)을 쓰고 임의 값(`w-[347px]`)과 인라인 스타일을 피합니다. 디자인에 없는 스타일(예: glass 효과)은 추가하지 않습니다.

```tsx
const buttonVariants = cva("inline-flex items-center rounded-xl text-sm", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      ghost: "hover:bg-accent",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Button({
  className,
  variant,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button className={cn(buttonVariants({ variant, className }))} {...props} />
  );
}
```
