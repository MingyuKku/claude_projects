import { tryit } from "radash";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

import {
  campaignDetailKey,
  convertCampaignDemo,
  getCampaignRegisterPath,
} from "@/entities/campaign";
import { readApiErrorReason } from "@/shared/api";
import { useTranslation } from "@/shared/i18n";

/**
 * 작성을 마친 데모를 실제 캠페인으로 전환. 확인 알럿 → 전환 → 1단계 작성 화면으로 `replace`.
 * 실패하면 데모 그대로 두고 토스트 후 기본 정보를 다시 읽음(구독이 끝났으면 안내가 "구독하기"로 바뀜).
 */
export function useDemoConversion(campaignIdx: number) {
  const { t } = useTranslation("features/register-campaign");
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  async function convert() {
    setIsConverting(true);
    const [error] = await tryit(convertCampaignDemo)(campaignIdx);
    setIsConverting(false);
    setIsConfirmOpen(false);
    if (error) {
      toast.error(
        t(
          readApiErrorReason(error) === "SUBSCRIPTION_REQUIRED"
            ? "demo.toast.subscriptionRequired"
            : "toast.requestFailed",
        ),
      );
      void mutate(campaignDetailKey(campaignIdx));
      return;
    }
    void navigate(getCampaignRegisterPath(campaignIdx, "campaign-info"), {
      replace: true,
    });
  }

  return {
    isConfirmOpen,
    isConverting,
    openConfirm: () => setIsConfirmOpen(true),
    closeConfirm: () => setIsConfirmOpen(false),
    convert,
  };
}
