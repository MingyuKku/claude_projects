import { serverApiV3 } from "@/shared/api";

/**
 * `POST /v3/mypage/bigbird-money/charge/{id}/test-deposit`. Stage 전용 테스트 API로, 이니시스 가상계좌 입금 통보를 대신 보내
 * 미입금 무통장 입금 건을 입금 완료로 만듦(잔액 반영까지 실제와 같음). `id`는 충전 건(`type=CHARGE`)의 서버 id.
 */
export function requestTestDeposit(chargeServerId: string) {
  return serverApiV3.post(
    `/mypage/bigbird-money/charge/${encodeURIComponent(chargeServerId)}/test-deposit`,
  );
}
