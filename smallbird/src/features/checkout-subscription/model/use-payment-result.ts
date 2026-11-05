import { useSearchParams } from "react-router";

const RESULT_PARAM = "result";
const REASON_PARAM = "reason";
const PG_MESSAGE_PARAM = "pgMessage";
// 서버가 함께 붙이지만 화면에서는 쓰지 않음(`pgCode`는 사용자에게 보여 줄 문구가 아님).
const PG_CODE_PARAM = "pgCode";
const CARD_ID_PARAM = "cardId";
// 서버가 함께 붙이지만 화면에서는 쓰지 않음(구독 목록을 다시 읽으면 반영됨).
const RESULT_EXTRA_PARAMS = ["subscriptionId", CARD_ID_PARAM, PG_CODE_PARAM];
// 주소는 누구나 만들 수 있어 긴 글이 토스트를 채우지 못하게 함. 이니시스 거절 사유는 짧은 문장.
const PG_MESSAGE_MAX_LENGTH = 100;

export type PaymentResultStatus = "success" | "fail";

function toStatus(value: string | null): PaymentResultStatus | null {
  return value === "success" || value === "fail" ? value : null;
}

/**
 * 결제창에서 돌아온 결과. 서버가 `{origin}{redirectUri}?result=success&subscriptionId=…` 또는
 * `?result=fail&reason=에러코드&pgCode=…&pgMessage=…`로 돌려보냄(카드 추가는 성공 시 `subscriptionId` 대신 `cardId`).
 * `pgMessage`는 결제사가 거절 사유를 준 경우에만 오는 한국어 원문이라 번역하지 않음. 알림을 띄운 뒤 `clear()`로 쿼리를 지워 새로고침해도 다시 뜨지 않게 함.
 */
export function usePaymentResult() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = toStatus(searchParams.get(RESULT_PARAM));
  const reason = searchParams.get(REASON_PARAM);
  const pgMessage =
    searchParams
      .get(PG_MESSAGE_PARAM)
      ?.trim()
      .slice(0, PG_MESSAGE_MAX_LENGTH) || undefined;
  // 카드 추가의 성공 결과(`cardId`)는 구독 결제가 아니라서 결제 완료로 다루지 않음. 카드 추가 쪽이 처리함.
  const isCardResult = searchParams.has(CARD_ID_PARAM);

  function clear() {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete(RESULT_PARAM);
        params.delete(REASON_PARAM);
        params.delete(PG_MESSAGE_PARAM);
        for (const name of RESULT_EXTRA_PARAMS) params.delete(name);
        return params;
      },
      { replace: true },
    );
  }

  return { status: isCardResult ? null : status, reason, pgMessage, clear };
}
