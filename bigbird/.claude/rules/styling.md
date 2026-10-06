---
paths:
  - "src/**/ui/**/*.tsx"
  - "src/**/*.css"
---

# UI 시스템 (shadcn/ui · Tailwind · CVA)

- **배치**: shadcn/ui 컴포넌트는 `src/shared/ui/`에 둡니다. 원본이라 직접 수정하지 않고, 커스터마이즈는 이를 감싸는 상위 컴포넌트에서 합니다 (훅과 린트가 이 폴더를 검사하지 않는 이유).
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
