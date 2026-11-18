import { cn } from "@/shared/lib/utils";
import { Separator } from "@/shared/ui/separator";

import type { ReactNode } from "react";

interface CardTitleBlockProps {
  /** 큰 제목 위의 작은 서비스 이름. 선택한 카드는 파랑, 준비중 카드는 회색. */
  eyebrow?: ReactNode;
  isEyebrowMuted?: boolean;
  title: ReactNode;
  badges?: ReactNode;
}

// Figma Card / Button 머리글: 가운데 정렬한 제목·배지 묶음과 아래 구분선.
export function CardTitleBlock({
  eyebrow,
  isEyebrowMuted = false,
  title,
  badges,
}: CardTitleBlockProps) {
  return (
    <div className="flex w-full flex-col items-center ds-gap-4 ds-px-5 ds-pt-5">
      <div className="flex flex-col items-center ds-gap-3">
        {eyebrow && (
          <p
            className={cn(
              "ds-text-lg-none-semibold",
              isEyebrowMuted ? "text-muted-foreground" : "text-primary",
            )}
          >
            {eyebrow}
          </p>
        )}
        <p className="ds-text-2xl-none-semibold">{title}</p>
      </div>
      {badges && <div className="flex gap-2">{badges}</div>}
      <Separator />
    </div>
  );
}
