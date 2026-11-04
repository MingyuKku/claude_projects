import { tryit } from "radash";
import { useEffect, useEffectEvent, useRef } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import { useRevalidateSubscriptionData } from "@/entities/subscription";
import { useTranslation } from "@/shared/i18n";

import { takeReturnParams } from "../lib/return-params";

const RESULT_PARAM = "result";
const CARD_ID_PARAM = "cardId";
// 같은 알림이 겹쳐 뜨지 않게 함(개발 모드의 effect 중복 실행 포함).
const SUCCESS_TOAST_ID = "billing-card-register-success";

interface BillingCardResultHandlerProps {
  /**
   * 결과 쿼리를 지운 새 쿼리를 넘겨 호출 쪽이 더 바꿀 수 있게 함(예: 카드가 보이는 탭으로 이동).
   * 등록을 시작할 때 돌아올 쿼리(`RegisterCardDialog`의 `returnParams`)를 남겼으면 이것 대신 그 쿼리를 넣음.
   */
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

  // 개발 모드의 effect 중복 실행에서 두 번째 실행이 남긴 쿼리를 이미 꺼낸 뒤라 카드 추가 화면으로 덮어쓰지 않게 한 번만 처리함.
  const isHandlingRef = useRef(false);

  const handle = useEffectEvent(async () => {
    if (isHandlingRef.current) return;
    isHandlingRef.current = true;
    toast.success(t("card.registerResult.success"), { id: SUCCESS_TOAST_ID });
    const returnParams = takeReturnParams();
    if (returnParams) {
      // 돌아갈 화면(결제 화면)이 카드 0장으로 읽은 목록을 보고 카드 없음 안내를 다시 띄우지 않게, 새 목록을 받은 뒤 옮김.
      await tryit(revalidate)();
    } else {
      void revalidate();
    }
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete(RESULT_PARAM);
        params.delete(CARD_ID_PARAM);
        if (returnParams) {
          for (const [key, value] of Object.entries(returnParams)) {
            params.set(key, value);
          }
        } else {
          onRegistered?.(params);
        }
        return params;
      },
      { replace: true },
    );
    isHandlingRef.current = false;
  });

  useEffect(() => {
    if (isRegistered) void handle();
  }, [isRegistered]);

  return null;
}
