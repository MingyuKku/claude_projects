import { SkeletonGroup } from "@/shared/components/skeleton-presets";
import { Skeleton } from "@/shared/ui/skeleton";

// 가이드를 처음 읽는 동안: 제목·방식 카드 두 개(높이 110)·탭 줄·기본 조건 패널과 같은 자리.
export function PostingGuideSkeleton() {
  return (
    <SkeletonGroup className="flex flex-col gap-5 px-4 pt-1 pb-5 tablet:ds-p-5">
      <Skeleton className="hidden h-4 w-32 tablet:block" />
      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-[repeat(2,--spacing(90.375))]">
        <Skeleton className="h-27.5 rounded-lg" />
        <Skeleton className="h-27.5 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-96 rounded-md" />
    </SkeletonGroup>
  );
}
