import {
  SkeletonGroup,
  TableSkeleton,
} from "@/shared/components/skeleton-presets";
import { Skeleton } from "@/shared/ui/skeleton";

const TABLE_ROW_COUNT = 5;
const CARD_SKELETON_COUNT = 3;
const CARD_ROW_COUNT = 4;

interface CopySourceListSkeletonProps {
  /** PC는 표, TAB·MO는 카드. */
  variant: "table" | "cards";
}

/** CopySourceList 자리. 목록 제목은 실제 화면이 그대로 그림. */
export function CopySourceListSkeleton({
  variant,
}: CopySourceListSkeletonProps) {
  if (variant === "table") {
    return (
      <SkeletonGroup>
        <TableSkeleton
          columnClassNames={["w-4", "w-32", "w-28", "w-20", "w-24", "w-20"]}
          rowCount={TABLE_ROW_COUNT}
          size="xs"
        />
      </SkeletonGroup>
    );
  }

  return (
    <SkeletonGroup className="flex flex-col gap-3">
      {Array.from({ length: CARD_SKELETON_COUNT }, (_, card) => (
        <div key={card} className="rounded-lg border">
          <div className="flex h-14 items-center gap-4 px-4">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-40" />
          </div>
          <hr className="mx-4 border-border" />
          <div className="flex flex-col pt-2.5 pb-4">
            {Array.from({ length: CARD_ROW_COUNT }, (_, row) => (
              <div
                key={row}
                className="flex h-12 items-center justify-between gap-4 px-4"
              >
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </SkeletonGroup>
  );
}
