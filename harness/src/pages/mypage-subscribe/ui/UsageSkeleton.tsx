import { SkeletonGroup } from "@/shared/components/skeleton-presets";
import { Skeleton } from "@/shared/ui/skeleton";

/** 이용요약 탭 자리의 로딩 표시. */
export function UsageSkeleton() {
  return (
    <SkeletonGroup className="flex flex-col gap-4">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </SkeletonGroup>
  );
}
