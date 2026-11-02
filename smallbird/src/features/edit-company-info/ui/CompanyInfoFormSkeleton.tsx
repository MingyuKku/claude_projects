import {
  SkeletonFormActions,
  SkeletonFormBody,
  SkeletonFormRow,
} from "@/shared/components/skeleton-presets";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

/** CompanyInfoForm 자리: 입력 8행 + 하단 버튼 줄 + 이용 안내 */
export function CompanyInfoFormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 tablet:gap-0">
        <Skeleton className="h-4 w-24 tablet:hidden" />
        <Card>
          <SkeletonFormBody>
            <SkeletonFormRow labelClassName="w-16" />
            <SkeletonFormRow labelClassName="w-20" />
            <SkeletonFormRow labelClassName="w-24" />
            <SkeletonFormRow labelClassName="w-32" />
            <SkeletonFormRow labelClassName="w-28" />
            <SkeletonFormRow labelClassName="w-36" />
            <SkeletonFormRow labelClassName="w-14" />
            <SkeletonFormRow labelClassName="w-20" />
          </SkeletonFormBody>
          <SkeletonFormActions />
        </Card>
      </section>
      <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
