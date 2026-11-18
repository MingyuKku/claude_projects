import {
  SkeletonFormActions,
  SkeletonFormBody,
  SkeletonFormRow,
} from "@/shared/components/skeleton-presets";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

/** BankAccountForm 자리: 입력 4행 + 하단 버튼 줄 */
export function BankAccountFormSkeleton() {
  return (
    <section className="flex flex-col gap-4 tablet:gap-0">
      <Skeleton className="h-4 w-24 tablet:hidden" />
      <Card>
        <SkeletonFormBody>
          <SkeletonFormRow labelClassName="w-12" />
          <SkeletonFormRow labelClassName="w-20" />
          <SkeletonFormRow labelClassName="w-16" />
          <SkeletonFormRow labelClassName="w-24" />
        </SkeletonFormBody>
        <SkeletonFormActions />
      </Card>
    </section>
  );
}
