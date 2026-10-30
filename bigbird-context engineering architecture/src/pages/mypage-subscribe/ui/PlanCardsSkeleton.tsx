import {
  SkeletonCard,
  SkeletonGroup,
} from "@/shared/components/skeleton-presets";

/** 구독 탭 상품 카드 4장 자리의 로딩 표시. */
export function PlanCardsSkeleton() {
  return (
    <SkeletonGroup className="grid grid-cols-1 gap-5 tablet:grid-cols-2 desktop:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </SkeletonGroup>
  );
}
