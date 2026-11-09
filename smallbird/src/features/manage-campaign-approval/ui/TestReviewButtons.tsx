import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

import { campaignKey, testReviewCampaign } from "@/entities/campaign";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import type { CampaignDetail } from "@/entities/campaign";

// 반려 화면 확인용 예시 사유(Figma 반려 시안의 2번·5번 섹션).
const SAMPLE_REJECTIONS = [
  {
    section: "PRODUCT",
    reason: "협찬 제품 금액이 실제 판매 금액과 일치하는지 확인해주세요.",
  },
  {
    section: "INTRO",
    reason: "캠페인 설명을 실제 사용 경험을 중심으로 보완해주세요.",
  },
] as const;

// 개발용 심사 전환(A-16, Stage 전용): 운영 앱 없이 승인 완료·반려 화면을 확인하려고 검토중 캠페인의 심사 결과를 정함.
// 쓰는 화면이 `import.meta.env.DEV`일 때만 그림. 검토중·재승인 검토중이 아니면 아무것도 그리지 않음.
export function TestReviewButtons({
  campaign,
}: {
  campaign: Pick<CampaignDetail, "campaignIdx" | "status">;
}) {
  const { t } = useTranslation("features/manage-campaign-approval");
  const { mutate } = useSWRConfig();
  const [isBusy, setIsBusy] = useState(false);

  if (campaign.status !== "REVIEWING" && campaign.status !== "RE_REVIEWING") {
    return null;
  }

  async function review(result: "APPROVE" | "REJECT") {
    setIsBusy(true);
    try {
      await testReviewCampaign(campaign.campaignIdx, {
        result,
        rejections: result === "REJECT" ? [...SAMPLE_REJECTIONS] : null,
      });
      await mutate(campaignKey(campaign.campaignIdx));
    } catch {
      toast.error(t("dev.failed"));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3">
      <span className="text-sm text-muted-foreground">{t("dev.label")}</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isBusy}
        onClick={() => void review("APPROVE")}
      >
        {t("dev.approve")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isBusy}
        onClick={() => void review("REJECT")}
      >
        {t("dev.reject")}
      </Button>
    </div>
  );
}
