import { cn } from "@/shared/lib/utils"

// Figma 디자인 시스템 Skeleton(4733:6553) 기준. 빛 줄기(skeleton-shimmer)는 시안에 모션 정의가 없어 코드에서 정함.
// 시안 면 색(muted)은 흰 배경과 거의 같아 빛 줄기가 보이지 않으므로 면을 border로 한 단계 진하게 함(디자인 확인 대기).
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("skeleton-shimmer rounded-md bg-border", className)}
      {...props}
    />
  )
}

export { Skeleton }
