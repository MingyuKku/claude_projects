import { useEffect, useEffectEvent } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import { useRevalidateSubscriptionData } from "@/entities/subscription";
import { useTranslation } from "@/shared/i18n";

const RESULT_PARAM = "result";
const CARD_ID_PARAM = "cardId";
// 같은 알림이 겹쳐 뜨지 않게 함(개발 모드의 effect 중복 실행 포함).
const SUCCESS_TOAST_ID = "billing-card-register-success";

interface BillingCardResultHandlerProps {
  /** 결과 쿼리를 지운 새 쿼리를 넘겨 호출 쪽이 더 바꿀 수 있게 함(예: 카드가 보이는 탭으로 이동). */
  onRegistered?: (params: URLSearchParams) => void;
}

/**
 * 카드 추가 결제창에서 돌아온 결과 처리. 서버가 `?result=success&cardId=…`로 돌려보내면 카드 목록을 다시 읽고 토스트를 띄운 뒤 쿼리를 지움.
 * 실패(`?result=fail&reason=…`)는 구독 시작과 같은 모양이라 `PaymentResultHandler`가 이유를 알림.
 */
export function BillingCardResultHandler({
  onRegistered,
}: BillingCardResultHandlerProps) {
  const { t } = useTranslation("features/manage-billing-cards");
  const [searchParams, setSearchParams] = useSearchParams();
  const revalidate = useRevalidateSubscriptionData();
  const isRegistered =
    searchParams.get(RESULT_PARAM) === "success" &&
    searchParams.has(CARD_ID_PARAM);

  const handle = useEffectEvent(() => {
    toast.success(t("card.registerResult.success"), { id: SUCCESS_TOAST_ID });
    void revalidate();
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete(RESULT_PARAM);
        params.delete(CARD_ID_PARAM);
        onRegistered?.(params);
        return params;
      },
      { replace: true },
    );
  });

  useEffect(() => {
    if (isRegistered) handle();
  }, [isRegistered]);

  return null;
}
