import { useState } from "react";
import { generatePath, useNavigate } from "react-router";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

import { useBigbirdMoneyBalance } from "@/entities/bigbird-money";
import {
  campaignDraftKey,
  campaignKey,
  cancelCampaignApproval,
} from "@/entities/campaign";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import type { CampaignDetail } from "@/entities/campaign";

// 취소 뒤 열 작성 화면의 8단계 주소 조각. 단계 slug는 스펙이 정한 값이고 `features/register-campaign`을 가져올 수 없어 여기에 둠.
const PAYMENT_STEP_QUERY = "?step=payment";

// 배너의 "승인 요청 취소"(검토중·재승인 검토중). 확인 알럿(Destructive)에서 "승인 요청 취소하기"를 누르면 결제 금액이 환불되고 캠페인이 등록 중으로 돌아가며,
// 작성 화면 8단계로 보냄(스펙 P-8: 어느 단계든 고친 뒤 8단계에서 다시 결제). 성공 전에는 알럿을 닫지 않고 중복 요청을 막음.
export function CancelApprovalButton({
  campaign,
}: {
  campaign: Pick<CampaignDetail, "campaignIdx">;
}) {
  const { t } = useTranslation("features/manage-campaign-approval");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();
  const { mutate: refreshBalance } = useBigbirdMoneyBalance();
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  async function handleConfirm() {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await cancelCampaignApproval(campaign.campaignIdx);
    } catch {
      toast.error(t("error.failed"));
      setIsBusy(false);
      return;
    }
    // 환불된 잔액과 등록 중으로 바뀐 캠페인을 새로 읽게 함(작성 화면이 옛 초안으로 열리지 않게 초안 캐시도 비움).
    void Promise.all([
      refreshBalance(),
      mutate(campaignKey(campaign.campaignIdx), undefined, {
        revalidate: false,
      }),
      mutate(campaignDraftKey(campaign.campaignIdx), undefined, {
        revalidate: false,
      }),
    ]).catch(() => undefined);
    setIsOpen(false);
    setIsBusy(false);
    void navigate(
      `${generatePath(ROUTES.campaignRegisterDraft, {
        campaignId: String(campaign.campaignIdx),
      })}${PAYMENT_STEP_QUERY}`,
      { replace: true },
    );
  }

  return (
    <>
      <Button
        type="button"
        className="max-tablet:h-9 max-tablet:min-w-16 max-tablet:px-2"
        onClick={() => setIsOpen(true)}
      >
        {t("cancel.action")}
      </Button>
      <AlertDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!isBusy) setIsOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancel.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cancel.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>
              {tCommon("action.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              destructive
              disabled={isBusy}
              onClick={(event) => {
                // 요청이 끝나기 전에 알럿이 닫히지 않게 기본 닫힘을 막고, 성공하면 직접 닫음.
                event.preventDefault();
                void handleConfirm();
              }}
            >
              {t("cancel.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
