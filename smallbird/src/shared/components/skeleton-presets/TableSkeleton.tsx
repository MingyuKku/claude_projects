import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

import type { VariantProps } from "class-variance-authority";

// 행 높이는 공통 Table의 size별 칸 높이와 같아야 로딩이 끝나도 표 높이가 그대로임.
const rowVariants = cva("flex items-center border-b last:border-b-0", {
  variants: {
    size: {
      xs: "h-12",
      sm: "h-14",
      md: "h-19",
      lg: "h-24",
    },
  },
  defaultVariants: { size: "sm" },
});

interface TableSkeletonProps extends VariantProps<typeof rowVariants> {
  /** 열마다 막대 너비. 열 수도 이 길이로 정함. */
  columnClassNames: readonly string[];
  rowCount: number;
}

/** 공통 Table(머리글 Gray 48px, 테두리 rounded-lg)과 같은 치수의 스켈레톤. size는 실제 표와 같은 값을 넘김. */
export function TableSkeleton({
  columnClassNames,
  rowCount,
  size,
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
        <div key={row} className={rowVariants({ size })}>
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
