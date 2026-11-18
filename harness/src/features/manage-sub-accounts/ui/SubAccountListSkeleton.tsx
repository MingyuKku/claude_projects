import {
  SkeletonGroup,
  TableSkeleton,
} from "@/shared/components/skeleton-presets";
import { Skeleton } from "@/shared/ui/skeleton";

import { SUB_ACCOUNT_PAGE_SIZE } from "../model/constants";

const CARD_SKELETON_COUNT = 3;
const CARD_ROW_COUNT = 4;

interface SubAccountListSkeletonProps {
  /** PC는 표, TAB·MO는 카드. */
  isTable: boolean;
}

/** SubAccountList의 표·카드 자리. 검색·생성 버튼 줄은 실제 화면이 그대로 그림. */
export function SubAccountListSkeleton({
  isTable,
}: SubAccountListSkeletonProps) {
  if (isTable) {
    return (
      <SkeletonGroup>
        <TableSkeleton
          columnClassNames={["w-24", "w-14", "w-36", "w-20", "w-32"]}
          rowCount={SUB_ACCOUNT_PAGE_SIZE}
        />
      </SkeletonGroup>
    );
  }

  return (
    <SkeletonGroup className="flex flex-col gap-5">
      {Array.from({ length: CARD_SKELETON_COUNT }, (_, card) => (
        <div key={card} className="flex flex-col gap-2">
          <div className="flex justify-end gap-2">
            <Skeleton className="h-10 w-27.75" />
            <Skeleton className="size-10" />
          </div>
          <div className="overflow-hidden rounded-lg border">
            {Array.from({ length: CARD_ROW_COUNT }, (_, row) => (
              <div
                key={row}
                className="flex h-12 items-center gap-4 border-b px-4 last:border-b-0"
              >
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </SkeletonGroup>
  );
}
