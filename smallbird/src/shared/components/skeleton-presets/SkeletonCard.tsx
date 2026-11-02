import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

// Figma Skeleton/Card(4733:6560): 이미지 영역 + 두 줄. 연한 상태(02)는 className에 opacity-50을 넘김.
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <div className="pr-12">
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}
