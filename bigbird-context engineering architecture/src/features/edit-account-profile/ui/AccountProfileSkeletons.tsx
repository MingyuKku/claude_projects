import {
  SkeletonInfoRow,
  SkeletonSectionCard,
} from "@/shared/components/skeleton-presets";

interface SkeletonProps {
  className?: string;
}

/** AccountProfileCard(보기) 자리: 읽기 전용 정보 5행 */
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
