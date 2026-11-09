import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

interface PaymentCardProps {
  title: string;
  className?: string;
  children: ReactNode;
}

// 8단계 카드 한 장(제목 + 본문). PC는 2×2 격자 위치를 `className`으로 받음.
export function PaymentCard({ title, className, children }: PaymentCardProps) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-6 rounded-lg border bg-card p-4 tablet:p-5",
        className,
      )}
    >
      <h3 className="text-base leading-none font-semibold text-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}
