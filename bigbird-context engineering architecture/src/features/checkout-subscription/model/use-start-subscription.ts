import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  readApiErrorReason,
  requestSavedCardSubscription,
  requestSubscriptionIssuance,
  submitIssuanceForm,
} from "@/entities/subscription";
import { ROUTES } from "@/shared/config";
import { useOnPageRestore } from "@/shared/lib";

import { useIssuanceErrorMessage } from "../lib/use-issuance-error-message";

import type { ActiveProductType, BillingPeriod } from "@/entities/subscription";

/**
 * 구독 시작. 기본 카드가 없으면 결제 서버에서 결제창 값을 받아 이니시스 결제 페이지로 이동함. 이동에 성공하면 이 화면은 떠나므로
 * `isStarting`은 실패했을 때만 false로 돌아옴. 결제가 끝나면 서버가 `redirectUri`로 돌려보냄(`usePaymentResult`가 받음).
 * 기본 카드가 있으면 결제창 없이 서버가 그 카드로 바로 결제하고, 성공하면 같은 결과 쿼리(`?result=success`)로 구독 탭에 돌아가 같은 완료 처리를 거침.
 */
export function useStartSubscription(hasSavedCard: boolean) {
  const navigate = useNavigate();
  const toErrorMessage = useIssuanceErrorMessage();
  const [isStarting, setIsStarting] = useState(false);
  // 이니시스 페이지에서 뒤로 가기로 돌아오면 복원된 화면의 "진행 중"이 남아 결제 버튼이 계속 막히므로 되돌림.
  useOnPageRestore(() => setIsStarting(false));

  async function start(type: ActiveProductType, period: BillingPeriod) {
    setIsStarting(true);
    try {
      if (hasSavedCard) {
        await requestSavedCardSubscription(type, period);
        void navigate({
          pathname: ROUTES.mypageSubscribe,
          search: "?result=success",
        });
        return;
      }
      const form = await requestSubscriptionIssuance(type, period, {
        redirectUri: ROUTES.mypageSubscribe,
      });
      submitIssuanceForm(form);
    } catch (error) {
      toast.error(toErrorMessage(readApiErrorReason(error)));
      setIsStarting(false);
    }
  }

  return { start, isStarting };
}
