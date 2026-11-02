import { cn } from "@/shared/lib/utils";
import { Card } from "@/shared/ui/card";

import type { ReactNode } from "react";

// Figma Card Section(6934:85217): 16px SemiBold 제목 아래 16px 간격으로 Card.
interface SectionCardProps {
  title: string;
  /** 같은 줄의 형제 섹션과 높이를 맞출 때 쓰는 클래스(카드가 남는 높이를 채움). */
  className?: string;
  cardClassName?: string;
  children: ReactNode;
}

export function SectionCard({
  title,
  className,
  cardClassName,
  children,
}: SectionCardProps) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-4", className)}>
      <h2 className="text-base leading-none font-semibold text-foreground">
        {title}
      </h2>
      <Card className={cn("flex-1", cardClassName)}>{children}</Card>
    </section>
  );
}
