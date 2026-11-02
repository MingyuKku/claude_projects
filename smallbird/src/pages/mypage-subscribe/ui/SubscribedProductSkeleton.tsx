import {
  SkeletonGroup,
  TableSkeleton,
} from "@/shared/components/skeleton-presets";

const COLUMN_CLASS_NAMES = [
  "w-32",
  "w-24",
  "w-24",
  "w-20",
  "w-24",
  "w-16",
] as const;

/** 결제내역 탭 "구독 결제 상품" 표 자리의 로딩 표시. */
export function SubscribedProductSkeleton() {
  return (
    <SkeletonGroup>
      <TableSkeleton columnClassNames={COLUMN_CLASS_NAMES} rowCount={2} />
    </SkeletonGroup>
  );
}
