/** 충전 입금 상태. 서버가 한글 값(`결제완료`·`대기중`·`결제취소`)으로 주므로 코드로 바꿔 씀(docs/mypage-api.md §2). */
export const CHARGE_STATUSES = ["paid", "pending", "canceled"] as const;

export type ChargeStatus = (typeof CHARGE_STATUSES)[number];

// 객체 리터럴이면 `constructor`·`toString` 같은 프로토타입 이름도 조회되므로 Map으로 둠.
const CHARGE_STATUS_BY_SERVER_VALUE = new Map<string, ChargeStatus>([
  ["결제완료", "paid"],
  ["대기중", "pending"],
  ["결제취소", "canceled"],
]);

/** 서버 값을 상태 코드로 바꿈. 목록에 없는 값은 null이라 호출하는 쪽이 서버 값을 그대로 보여 줌. */
export function toChargeStatus(serverValue: string): ChargeStatus | null {
  return CHARGE_STATUS_BY_SERVER_VALUE.get(serverValue) ?? null;
}
