---
paths:
  - "src/**/ui/**/*.tsx"
  - "src/app/layouts/**/*.tsx"
  - "src/**/*.css"
---

# UI 시스템 (shadcn/ui · Tailwind · CVA)

- **배치**: shadcn/ui 컴포넌트는 `src/shared/ui/`에 둡니다. Figma 디자인 시스템이 shadcn 키트를 회사 디자인으로 바꾼 것이므로, Figma와 다른 부분은 래퍼를 만들지 않고 이 폴더의 파일을 고칩니다. 다만 사용자가 요청하지 않은 수정은 하기 전에 차이와 소비처를 보고해 확인받습니다(이 프로젝트의 디자인 시스템 자료가 Figma 최신과 다를 수 있음). 화면 시안과 디자인 시스템 컴포넌트 정의가 다르면 화면 시안이 기준이고, 디자인 시스템과 다른 점은 시안 불일치로 보고합니다. 기능 전용 변형은 여기 넣지 않고 상위 컴포넌트에서 감쌉니다.
- **읽기 전용 정보 행**: 시안의 `Table Row` + `Table Base / Cell`(Size=xs)로 그린 라벨 왼쪽·값 오른쪽 행은 `shared/components/info-row`의 `InfoRow`로 만들고 화면마다 새로 만들지 않습니다. 화면별 차이는 옵션으로 고르고, 옵션에 없는 차이가 시안에 있으면 옵션을 추가합니다. 회색 라벨 칸이 있는 표형 카드와 크리에이터 카드(`ProfileTableCard`)는 다른 UI라 해당하지 않습니다.
- **shadcn CLI 재설치 주의**: `shadcn add --overwrite`는 직접 고친 내용을 덮어씁니다. 업데이트가 필요하면 diff를 보고 수동으로 합칩니다. CLI 출력 형식(따옴표·세미콜론)을 유지하기 위해 이 폴더는 Prettier 검사에서만 제외되어 있습니다. 직접 고치는 파일이므로 ESLint(import 정렬·훅·접근성 규칙)는 검사합니다.
- **클래스 병합**: `src/shared/lib/utils.ts`의 `cn`(`clsx` + `tailwind-merge`)만 씁니다.
- **변형**: variant, size 같은 변형은 `cva`로 선언해 타입으로 노출합니다. 문자열 삼항 연산으로 클래스를 조립하지 않습니다.
- **ref**: React 19에서는 `ref`가 일반 prop이므로 `forwardRef`를 쓰지 않습니다.
- **토큰**: 색상·간격은 시맨틱 토큰(`text-foreground`, `bg-primary`)을 쓰고 임의 값(`w-[347px]`)과 인라인 스타일을 피합니다. 디자인에 없는 스타일(예: glass 효과)은 추가하지 않습니다.
- **Figma 디자인 시스템 토큰(`ds-`)**: Figma의 간격(gap·padding)·텍스트 스타일·그림자는 Tailwind 이름을 쓰지만 값이 기기마다 다르거나 묶음이라, 시안에 보이는 이름 앞에 `ds-`를 붙여 씁니다(`gap-6` → `ds-gap-6`, `text-sm/leading-5/medium` → `ds-text-sm-5-medium`). 정의는 `src/app/styles/ds-tokens.css`(생성 파일, 원본 `scripts/design/figma-design-system.json`)에 있고, 없는 이름이 필요하거나 값이 시안과 다르면 원본 JSON을 바로 고치지 말고 보고해 확인받은 뒤 고치고 `pnpm ds:tokens`로 다시 만듭니다. 기존 화면의 Tailwind 기본 클래스는 그 화면을 고칠 때 옮깁니다.

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
