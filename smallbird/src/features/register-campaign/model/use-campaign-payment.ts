import { useRef, useState } from "react";
import { generatePath, useNavigate } from "react-router";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

import { useBigbirdMoneyBalance } from "@/entities/bigbird-money";
import { campaignKey, payCampaign } from "@/entities/campaign";
import { isApiError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";

import { calculatePayment } from "./calculate-payment";
import { useCampaignRegisterStoreApi } from "./store-context";
import { useCampaignSave } from "./use-campaign-save";

/** 결제 결과 알럿. 잔액 부족은 닫기만 하고, 완료는 확인하면 등록 내역으로 감. */
export type PaymentAlert = "insufficient" | "done";

/**
 * "결제하기"가 모든 단계 검사를 통과한 뒤의 처리(스펙 §3 8단계). 결제 완료가 곧 승인 요청임.
 * 1. 서버가 저장된 초안으로 금액을 다시 계산하므로 먼저 저장하고(실패하면 중단), 2. 0원보다 크면 잔액을 새로 읽어 부족하면 알럿,
 * 3. 결제를 요청하고 완료 알럿, 확인하면 등록 내역으로 `replace`(결제한 뒤 작성 화면으로 돌아오지 않게). 실패는 토스트(금액이 달라졌으면 그 안내).
 */
export function useCampaignPayment() {
  const { t } = useTranslation("features/register-campaign");
  const navigate = useNavigate();
  const { mutate: mutateCache } = useSWRConfig();
  const { mutate: refreshBalance } = useBigbirdMoneyBalance();
  const storeApi = useCampaignRegisterStoreApi();
  const { saveBeforeMove } = useCampaignSave();
  const [alert, setAlert] = useState<PaymentAlert | null>(null);
  const isPayingRef = useRef(false);

  async function pay() {
    // 결제 요청이 두 번 나가지 않게, 처리 중에는 같은 동작을 받지 않음.
    if (isPayingRef.current) return;
    isPayingRef.current = true;
    try {
      if (!(await saveBeforeMove())) return;
      const { campaignIdx } = storeApi.getState().draft;
      const { total } = calculatePayment(storeApi.getState().draft);

      if (total > 0) {
        const current = (await refreshBalance())?.amount;
        if (current === undefined) {
          toast.error(t("payment.error.failed"));
          return;
        }
        if (current < total) {
          setAlert("insufficient");
          return;
        }
      }

      await payCampaign(campaignIdx, total);
      // 결제한 금액만큼 헤더 잔액을 갱신하고, 상태가 바뀐 등록 내역은 다음에 새로 읽게 함.
      void Promise.all([
        refreshBalance(),
        mutateCache(campaignKey(campaignIdx), undefined, {
          revalidate: false,
        }),
      ]).catch(() => undefined);
      setAlert("done");
    } catch (error) {
      const reason = isApiError(error)
        ? (error.data as { reason?: string } | undefined)?.reason
        : undefined;
      toast.error(
        reason === "AMOUNT_CHANGED"
          ? t("payment.error.amountChanged")
          : t("payment.error.failed"),
      );
    } finally {
      isPayingRef.current = false;
    }
  }

  function closeAlert() {
    const wasDone = alert === "done";
    setAlert(null);
    if (!wasDone) return;
    void navigate(
      generatePath(ROUTES.campaignDetail, {
        campaignId: String(storeApi.getState().draft.campaignIdx),
      }),
      { replace: true },
    );
  }

  return { pay, alert, closeAlert };
}
