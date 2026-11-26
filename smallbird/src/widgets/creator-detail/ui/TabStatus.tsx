import { SkeletonGroup } from "@/shared/components/skeleton-presets";
import { Skeleton } from "@/shared/ui/skeleton";

import type { ReactNode } from "react";

export function TabLoading({ className }: { className: string }) {
  return (
    <SkeletonGroup>
      <Skeleton className={className} />
    </SkeletonGroup>
  );
}

/** 보여 줄 값이 없는 탭. */
export function TabEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="py-10 text-center ds-text-sm-5-medium text-muted-foreground">
      {children}
    </p>
  );
}
