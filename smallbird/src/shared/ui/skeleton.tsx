import { cn } from "@/shared/lib/utils"

// shadcn/ui Skeleton. 불러오는 중이라는 안내는 SkeletonGroup이 하므로 막대는 화면 낭독기에서 숨김.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-accent", className)}
      {...props}
    />
  )
}

export { Skeleton }
