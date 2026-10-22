import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

// Figma Skeleton/Line(4733:6558): 아바타 + 두 줄. 연한 상태(02)는 className에 opacity-50을 넘김.
export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full items-center gap-4", className)}>
      <Skeleton className="size-12 shrink-0 rounded-full" />
      <div className="flex min-w-px flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <div className="pr-12">
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}
