import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

import { campaignKey, requestCampaignReapproval } from "@/entities/campaign";
import { useTranslation } from "@/shared/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import type { CampaignDetail } from "@/entities/campaign";

// 반려 상태 하단의 "재승인 요청". 누르면 바로 요청하고(횟수를 넘기면 서버가 거절해 토스트), 완료 알럿은 "확인"만 두며
// 확인하면 등록 내역을 다시 읽어 재승인 검토중으로 바뀜(스펙 §3 등록 내역).
export function ReapprovalButton({
  campaign,
}: {
  campaign: Pick<CampaignDetail, "campaignIdx">;
}) {
  const { t } = useTranslation("features/manage-campaign-approval");
  const { t: tCommon } = useTranslation();
  const { mutate } = useSWRConfig();
  const [isBusy, setIsBusy] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleClick() {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await requestCampaignReapproval(campaign.campaignIdx);
      setIsDone(true);
    } catch {
      toast.error(t("error.failed"));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleConfirm() {
    setIsDone(false);
    await mutate(campaignKey(campaign.campaignIdx));
  }

  return (
    <>
      <Button
        type="button"
        disabled={isBusy}
        onClick={() => void handleClick()}
      >
        {t("reapproval.action")}
      </Button>
      <AlertDialog
        open={isDone}
        onOpenChange={(open) => {
          if (!open) void handleConfirm();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("reapproval.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("reapproval.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>{tCommon("action.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
