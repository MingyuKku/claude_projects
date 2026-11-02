/** 충전/출금 내역의 상태. 서버 코드(`PENDING` 등, docs/mypage-api.md §2)를 화면용 코드로 바꿔 씀. */
export const CHARGE_STATUSES = [
  "paid",
  "withdrawn",
  "pending",
  "canceled",
] as const;

export type ChargeStatus = (typeof CHARGE_STATUSES)[number];

/** 상태 필터가 서버로 보내는 코드. */
export const SERVER_CHARGE_STATUS = {
  paid: "DEPOSIT_COMPLETED",
  withdrawn: "WITHDRAWAL_COMPLETED",
  pending: "PENDING",
  canceled: "DEPOSIT_EXPIRED",
} as const satisfies Record<ChargeStatus, string>;

// 객체 리터럴이면 `constructor`·`toString` 같은 프로토타입 이름도 조회되므로 Map으로 둠.
const CHARGE_STATUS_BY_SERVER_VALUE = new Map<string, ChargeStatus>(
  CHARGE_STATUSES.map((status) => [SERVER_CHARGE_STATUS[status], status]),
);

/** 서버 코드를 상태로 바꿈. 목록에 없는 값은 null이라 호출하는 쪽이 서버 값을 그대로 보여 줌. */
export function toChargeStatus(serverValue: string): ChargeStatus | null {
  return CHARGE_STATUS_BY_SERVER_VALUE.get(serverValue) ?? null;
}
