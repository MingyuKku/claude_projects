import { useEffect, useEffectEvent } from "react";
import { toast } from "sonner";

import { useRevalidateSubscriptionData } from "@/entities/subscription";

import { useIssuanceErrorMessage } from "../lib/use-issuance-error-message";
import { usePaymentResult } from "../model/use-payment-result";
import { PaymentCompletedDialog } from "./PaymentCompletedDialog";

import type { PaymentResultStatus } from "../model/use-payment-result";

// 같은 실패 알림이 겹쳐 뜨지 않게 함(개발 모드의 effect 중복 실행 포함).
const FAIL_TOAST_ID = "subscription-payment-fail";

/**
 * 결제창에서 돌아온 결과 처리. 성공이면 구독 데이터를 다시 읽고 완료 알럿, 실패면 이유를 토스트로 알리고 쿼리를 지움.
 * 돌아오는 주소에는 결제 화면 쿼리(`panel`)가 없어 구독 탭이 열리므로 결제 화면이 아니라 페이지에 둠.
 */
export function PaymentResultHandler() {
  const { status, reason, clear } = usePaymentResult();
  const revalidate = useRevalidateSubscriptionData();
  const toErrorMessage = useIssuanceErrorMessage();

  // 처리 로직은 최신 값을 읽되, 효과는 결과 쿼리가 바뀔 때만 다시 실행함.
  const handleResult = useEffectEvent((next: PaymentResultStatus | null) => {
    if (next === "success") {
      void revalidate();
    } else if (next === "fail") {
      toast.error(toErrorMessage(reason), { id: FAIL_TOAST_ID });
      clear();
    }
  });

  useEffect(() => {
    handleResult(status);
  }, [status, reason]);

  return (
    <PaymentCompletedDialog open={status === "success"} onConfirm={clear} />
  );
}
