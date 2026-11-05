/** 최소 충전 금액(원). 스펙 §3 금액 규칙. */
export const MIN_CHARGE_AMOUNT = 100_000;
/** 1회 충전 한도(원). */
export const MAX_CHARGE_AMOUNT = 100_000_000;
/** 빠른 금액 버튼. 입력값에 더함. */
export const QUICK_AMOUNTS = [100_000, 500_000, 1_000_000, 10_000_000] as const;
/**
 * 입력 자릿수 상한. 한도를 넘는 값도 오류 문구로 보여 줘야 해서 한도보다 넉넉히 두되,
 * 안전한 정수 범위를 넘지 않게 함.
 */
export const MAX_INPUT_DIGITS = 9;

/** 이니시스 결제창에 보이는 상품명. 결제 서버 연동값이라 번역하지 않음. */
export const PAYMENT_GOODS_NAME = "빅버드 머니 충전";
/** 결제 서버가 충전용 결제로 구분하는 값(`PaymentMethodType`). */
export const PAYMENT_METHOD_TYPE = "BIZ";
/**
 * 결제 서버의 v3 전용 결제 시작 API 경로(`POST`). 같은 접두사 아래로 가정했다가 2026-10-27 백엔드 로컬 결제 서버
 * (`192.168.0.15:3101`)에서 결제창이 열리는 것을 확인함.
 */
export const PAY_REQUEST_PATH = "/v3/mypage/bigbird-money/pay";
/** 이니시스 표준결제가 읽는 폼의 id. */
export const INICIS_FORM_ID = "SendPayForm_bigbird";

/**
 * 결제 서버가 사용자를 돌려보낼 때 `redirectUri` 뒤에 문자열로 이어 붙이는 쿼리(`?isPaid=true&gopaymethod=…&goodName=…`).
 * 옛 API는 `isPaied`였고 v3 전용 API에서 `isPaid`로 바뀜. 페이지가 `isPaid=true`를 보고 잔액·충전 내역을 다시 읽고 알림을 띄움.
 * 실패·취소는 `?isPaid=false&code=PAYMENT_FAILED|USER_CANCELED`(2026-10-30 17:11 배포)로 오는데 안내 문구가 정해지기 전이라
 * `true`가 아니면 알림 없이 일반 방문으로 보고 쿼리만 지움.
 */
export const PAYMENT_RETURN_PARAM = "isPaid";
export const PAYMENT_RETURN_SUCCESS = "true";

/** 결제 시작 API의 `deviceType`. 서버가 값에 따라 PC 표준결제 값 또는 모바일 폼 값을 줌. */
export type DeviceType = "PC" | "MOBILE";
/** 이니시스 모바일 결제 폼의 id. */
export const INICIS_MOBILE_FORM_ID = "SendPayForm_bigbird_mobile";
