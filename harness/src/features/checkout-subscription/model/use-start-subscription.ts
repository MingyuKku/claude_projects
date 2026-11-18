import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  readApiErrorPgMessage,
  readApiErrorReason,
  requestSavedCardSubscription,
} from "@/entities/subscription";
import { ROUTES } from "@/shared/config";

import { useIssuanceErrorMessage } from "../lib/use-issuance-error-message";

import type { ActiveProductType, BillingPeriod } from "@/entities/subscription";

/**
 * 구독 시작. 결제창 없이 서버가 기본 카드로 바로 결제하고, 성공하면 결과 쿼리(`?result=success`)로 구독 탭에 돌아가
 * `usePaymentResult`가 완료 알럿을 띄움. 카드 등록은 결제 화면에 오기 전에 끝나 있어야 함(카드 없음 알럿).
 * 실패하면 이유를 토스트로 알리고 화면에 남으며 `isStarting`은 false로 돌아옴. 결제사(이니시스)가 거절 사유를 줬으면(예: "잔액부족")
 * 코드별 안내 문구 아래에 그대로 덧붙여 보여 줌.
 */
export function useStartSubscription() {
  const navigate = useNavigate();
  const toErrorMessage = useIssuanceErrorMessage();
  const [isStarting, setIsStarting] = useState(false);

  async function start(
    type: ActiveProductType,
    period: BillingPeriod,
    installmentMonths?: number,
  ) {
    setIsStarting(true);
    try {
      await requestSavedCardSubscription(type, period, installmentMonths);
      void navigate({
        pathname: ROUTES.mypageSubscribe,
        search: "?result=success",
      });
    } catch (error) {
      const message = toErrorMessage(readApiErrorReason(error));
      const pgMessage = readApiErrorPgMessage(error);
      if (pgMessage) toast.error(message, { description: pgMessage });
      else toast.error(message);
      setIsStarting(false);
    }
  }

  return { start, isStarting };
}
