import {
  SkeletonFormRow,
  SkeletonInfoRow,
  SkeletonSectionCard,
} from "@/shared/components/skeleton-presets";
import { Skeleton } from "@/shared/ui/skeleton";

interface SkeletonProps {
  className?: string;
}

/** AccountInfoCard 자리: 읽기 전용 정보 5행 */
export function AccountInfoCardSkeleton({ className }: SkeletonProps) {
  return (
    <SkeletonSectionCard className={className}>
      <div className="flex flex-col p-3 tablet:p-5">
        <SkeletonInfoRow labelClassName="w-12" valueClassName="w-28" />
        <SkeletonInfoRow labelClassName="w-10" valueClassName="w-20" />
        <SkeletonInfoRow labelClassName="w-14" valueClassName="w-32" />
        <SkeletonInfoRow labelClassName="w-12" valueClassName="w-44" />
        <SkeletonInfoRow labelClassName="w-16" valueClassName="w-24" />
      </div>
    </SkeletonSectionCard>
  );
}

/** AccountProfileForm 자리: 프로필 이미지 + 입력 4행 + 하단 버튼 줄 */
export function AccountProfileFormSkeleton({ className }: SkeletonProps) {
  return (
    <SkeletonSectionCard className={className}>
      <div className="flex flex-col p-3 tablet:p-5">
        <div className="flex flex-col gap-2 p-3.5 tablet:gap-3 tablet:p-0">
          <div className="grid grid-cols-1 gap-2 tablet:min-h-12 tablet:grid-cols-2 tablet:items-start tablet:gap-0">
            <div className="tablet:min-h-12 tablet:px-4">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-center tablet:justify-start tablet:px-4">
              <Skeleton className="h-22 w-23 rounded-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 tablet:gap-0">
            <SkeletonFormRow labelClassName="w-20" />
            <SkeletonFormRow labelClassName="w-24" />
            <SkeletonFormRow labelClassName="w-14" />
            <SkeletonFormRow labelClassName="w-16" />
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2 p-3 tablet:p-5">
        <Skeleton className="h-7 w-16" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </SkeletonSectionCard>
  );
}
