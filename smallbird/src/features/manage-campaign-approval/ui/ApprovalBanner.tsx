import { Check, Info, TriangleAlert } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import type { ApprovalStatus, CampaignDetail } from "@/entities/campaign";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type BannerStatus = Exclude<ApprovalStatus, "DRAFT">;
type BannerKey = "reviewing" | "rejected" | "reReviewing" | "approved";

// 상태별 아이콘과 제목 색(Figma 7555:334774·335441·334937·335100): 검토중·재승인 검토중은 파란 info, 반려는 빨간 경고, 승인 완료는 회색 check(원 없음).
const BANNERS: Record<
  BannerStatus,
  { Icon: LucideIcon; toneClassName: string; key: BannerKey }
> = {
  REVIEWING: { Icon: Info, toneClassName: "text-primary", key: "reviewing" },
  REJECTED: {
    Icon: TriangleAlert,
    toneClassName: "text-destructive",
    key: "rejected",
  },
  RE_REVIEWING: {
    Icon: Info,
    toneClassName: "text-primary",
    key: "reReviewing",
  },
  // 승인 완료는 강조 없이 회색 check(시안 7555:335100).
  APPROVED: {
    Icon: Check,
    toneClassName: "text-muted-foreground",
    key: "approved",
  },
};

interface ApprovalBannerProps {
  campaign: Pick<CampaignDetail, "status">;
  /** 배너 오른쪽의 버튼(승인 요청 취소). 상태가 정하고, 없으면 그리지 않음. */
  action?: ReactNode;
  className?: string;
}

// 등록 내역 맨 위의 승인 상태 배너(Figma Chat Base / Message Alert): 아이콘 + 굵은 제목 + 본문 + 오른쪽 버튼.
// 등록 중(결제 전)은 등록 내역에 오지 않아 그리지 않음.
export function ApprovalBanner({
  campaign,
  action,
  className,
}: ApprovalBannerProps) {
  const { t } = useTranslation("features/manage-campaign-approval");
  if (campaign.status === "DRAFT") return null;
  const { Icon, toneClassName, key } = BANNERS[campaign.status];

  return (
    <section
      aria-label={t(`banner.${key}.title`)}
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4 tablet:flex-row tablet:items-center tablet:gap-4 tablet:p-5",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3
          className={cn(
            "flex items-center gap-2 text-base leading-6 font-semibold",
            toneClassName,
          )}
        >
          <Icon aria-hidden className="size-5 shrink-0" />
          {t(`banner.${key}.title`)}
        </h3>
        <p className="text-sm leading-5 text-foreground">
          {t(`banner.${key}.description`)}
        </p>
      </div>
      {action && (
        <div className="shrink-0 self-end tablet:self-auto">{action}</div>
      )}
    </section>
  );
}
