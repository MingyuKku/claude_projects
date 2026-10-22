import { cn } from "@/shared/lib/utils";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

import type { ReactNode } from "react";

// 마이페이지 폼·카드(SectionCard, FormRow, 정보 행)와 같은 치수의 스켈레톤.
// 로딩이 끝나 실제 화면으로 바뀔 때 레이아웃이 움직이지 않도록 원본의 높이·여백을 그대로 따름.

interface SkeletonSectionCardProps {
  /** 제목 막대 너비 */
  titleClassName?: string;
  className?: string;
  children: ReactNode;
}

/** SectionCard: 제목 막대(16px 글자 높이) + Card */
export function SkeletonSectionCard({
  titleClassName = "w-24",
  className,
  children,
}: SkeletonSectionCardProps) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-4", className)}>
      <Skeleton className={cn("h-4", titleClassName)} />
      <Card className="flex-1">{children}</Card>
    </section>
  );
}

/** FormRow: PC·TAB은 라벨 칸 | 입력 칸, MO는 라벨 위·입력 아래 */
export function SkeletonFormRow({
  labelClassName = "w-20",
}: {
  labelClassName?: string;
}) {
  return (
    <div className="grid w-full grid-cols-1 gap-2 tablet:min-h-12 tablet:grid-cols-2 tablet:items-start tablet:gap-0">
      <div className="flex items-center tablet:min-h-12 tablet:px-4">
        <Skeleton className={cn("h-4", labelClassName)} />
      </div>
      <div className="tablet:px-4 tablet:py-1">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

/** 읽기 전용 정보 행(라벨 | 값). 높이 48 */
export function SkeletonInfoRow({
  labelClassName = "w-16",
  valueClassName = "w-32",
}: {
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-2 px-4">
      <Skeleton className={cn("h-4", labelClassName)} />
      <Skeleton className={cn("h-4", valueClassName)} />
    </div>
  );
}

/** 카드 하단 취소·저장 버튼 줄 */
export function SkeletonFormActions() {
  return (
    <div className="flex justify-end gap-2 px-3 py-4 tablet:p-5">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-20" />
    </div>
  );
}

/** 카드 안 폼 본문 여백. FormRow 목록을 children으로 넘김 */
export function SkeletonFormBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col p-3 pb-3.5 tablet:p-5 tablet:pb-3">
      <div className="flex flex-col gap-2 p-3.5 tablet:gap-0 tablet:p-0">
        {children}
      </div>
    </div>
  );
}
