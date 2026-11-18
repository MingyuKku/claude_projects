import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

interface TableSkeletonProps {
  /** 열마다 막대 너비. 열 수도 이 길이로 정함. */
  columnClassNames: readonly string[];
  rowCount: number;
}

/** 공통 Table(머리글 Gray 48px, 행 56px, 테두리 rounded-lg)과 같은 치수의 스켈레톤. */
export function TableSkeleton({
  columnClassNames,
  rowCount,
}: TableSkeletonProps) {
  const rows = Array.from({ length: rowCount }, (_, index) => index);

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex h-12 items-center border-b bg-muted/40">
        {columnClassNames.map((_, column) => (
          <div key={column} className="flex-1 px-4">
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={row}
          className="flex h-14 items-center border-b last:border-b-0"
        >
          {columnClassNames.map((className, column) => (
            <div key={column} className="flex-1 px-4">
              <Skeleton className={cn("h-4", className)} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
