import {
  SkeletonGroup,
  TableSkeleton,
} from "@/shared/components/skeleton-presets";
import { Skeleton } from "@/shared/ui/skeleton";

import { LIST_PAGE_SIZE } from "../model/constants";

const CARD_SKELETON_COUNT = 3;
const CARD_ROW_COUNT = 7;

interface UsageListSkeletonProps {
  /** PC·TAB은 표, MO는 카드. */
  isTable: boolean;
}

/** UsageHistory의 표·카드 자리. 제목·툴바는 실제 화면이 그대로 그림. */
export function UsageListSkeleton({ isTable }: UsageListSkeletonProps) {
  if (isTable) {
    return (
      <SkeletonGroup>
        <TableSkeleton
          columnClassNames={["w-40", "w-28", "w-36", "w-20", "w-24", "w-8"]}
          rowCount={LIST_PAGE_SIZE}
        />
      </SkeletonGroup>
    );
  }

  return (
    <SkeletonGroup className="flex flex-col gap-5">
      {Array.from({ length: CARD_SKELETON_COUNT }, (_, card) => (
        <div key={card} className="overflow-hidden rounded-lg border">
          {Array.from({ length: CARD_ROW_COUNT }, (_, row) => (
            <div
              key={row}
              className="flex h-12 items-center gap-4 border-b px-4 last:border-b-0"
            >
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      ))}
    </SkeletonGroup>
  );
}
