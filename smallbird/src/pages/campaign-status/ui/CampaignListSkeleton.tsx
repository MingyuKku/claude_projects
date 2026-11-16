import { CAMPAIGN_PAGE_SIZE } from "@/entities/campaign";
import {
  SkeletonGroup,
  TableSkeleton,
} from "@/shared/components/skeleton-presets";
import { Skeleton } from "@/shared/ui/skeleton";

const CARD_SKELETON_COUNT = 4;

interface CampaignListSkeletonProps {
  /** PC는 표, TAB·MO는 카드. */
  isTable: boolean;
}

/** 목록의 표·카드 자리. 탭·툴바는 실제 화면이 그대로 그림. */
export function CampaignListSkeleton({ isTable }: CampaignListSkeletonProps) {
  if (isTable) {
    return (
      <SkeletonGroup>
        <TableSkeleton
          columnClassNames={["w-16", "w-72", "w-28", "w-40", "w-20", "w-8"]}
          rowCount={CAMPAIGN_PAGE_SIZE}
        />
      </SkeletonGroup>
    );
  }

  return (
    <SkeletonGroup className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
      {Array.from({ length: CARD_SKELETON_COUNT }, (_, card) => (
        <div key={card} className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </SkeletonGroup>
  );
}
