import { tryit } from "radash";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

import { campaignDetailKey, reviewCampaignForDev } from "@/entities/campaign";
import { Button } from "@/shared/ui/button";

interface DevReviewToolsProps {
  campaignIdx: number;
}

/** 개발 서버 반려 사유 예시(시안 원문). */
const DEV_REJECT_REASON =
  "협찬 제품 금액이 실제 판매 금액과 일치하는지 확인해주세요.";

// 운영 화면이 없어 승인 검토중 캠페인을 반려·승인으로 바꾸는 개발 서버 도구. 배포 빌드에 들어가지 않아 문구를 번역하지 않음.
export function DevReviewTools({ campaignIdx }: DevReviewToolsProps) {
  const { mutate } = useSWRConfig();

  async function review(decision: Parameters<typeof reviewCampaignForDev>[1]) {
    const [error] = await tryit(reviewCampaignForDev)(campaignIdx, decision);
    if (error) toast.error("상태를 바꾸지 못했습니다.");
    void mutate(campaignDetailKey(campaignIdx));
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
      개발 서버 확인용(운영팀 심사):
      <Button
        size="sm"
        variant="outline-foreground"
        onClick={() =>
          void review({ type: "reject", reason: DEV_REJECT_REASON })
        }
      >
        반려
      </Button>
      <Button
        size="sm"
        variant="outline-foreground"
        onClick={() => void review({ type: "approve" })}
      >
        승인 완료
      </Button>
    </div>
  );
}
