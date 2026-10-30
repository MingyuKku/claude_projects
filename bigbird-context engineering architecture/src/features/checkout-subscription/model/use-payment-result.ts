import { useSearchParams } from "react-router";

const RESULT_PARAM = "result";
const REASON_PARAM = "reason";
const CARD_ID_PARAM = "cardId";
// 서버가 함께 붙이지만 화면에서는 쓰지 않음(구독 목록을 다시 읽으면 반영됨).
const RESULT_EXTRA_PARAMS = ["subscriptionId", CARD_ID_PARAM];

export type PaymentResultStatus = "success" | "fail";

function toStatus(value: string | null): PaymentResultStatus | null {
  return value === "success" || value === "fail" ? value : null;
}

/**
 * 결제창에서 돌아온 결과. 서버가 `{origin}{redirectUri}?result=success&subscriptionId=…` 또는
 * `?result=fail&reason=에러코드`로 돌려보냄(카드 추가는 성공 시 `subscriptionId` 대신 `cardId`). 알림을 띄운 뒤 `clear()`로 쿼리를 지워 새로고침해도 다시 뜨지 않게 함.
 */
export function usePaymentResult() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = toStatus(searchParams.get(RESULT_PARAM));
  const reason = searchParams.get(REASON_PARAM);
  // 카드 추가의 성공 결과(`cardId`)는 구독 결제가 아니라서 결제 완료로 다루지 않음. 카드 추가 쪽이 처리함.
  const isCardResult = searchParams.has(CARD_ID_PARAM);

  function clear() {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete(RESULT_PARAM);
        params.delete(REASON_PARAM);
        for (const name of RESULT_EXTRA_PARAMS) params.delete(name);
        return params;
      },
      { replace: true },
    );
  }

  return { status: isCardResult ? null : status, reason, clear };
}
