/**
 * 공급자 로그인 시작의 결과. 인가 코드를 바로 받거나(`code`, 팝업), 공급자 화면으로 전체 이동해 돌아온 뒤 이어 가거나(`redirecting`),
 * 사용자가 취소함(`cancelled`).
 */
export type SocialLinkRequest =
  | { status: "code"; code: string; redirectUri: string }
  | { status: "redirecting" }
  | { status: "cancelled" };

/**
 * 연결 요청 본문. 카카오·구글·애플은 인가 코드와 그 코드를 받을 때 쓴 `redirectUri`,
 * 네이버는 인가 코드와 인가 요청에 쓴 `state`(서버가 교환).
 * 공급자가 어느 쪽만 받는지는 서버가 정하고, 맞지 않게 보내면 400 `INVALID_SNS_CODE`.
 */
export type SocialLinkCredential =
  { code: string; redirectUri: string } | { code: string; state: string };

/** 연결(`POST /account/sns/{platform}`) 결과. 실패 `reason`은 서버 `V3ErrorResponse.reason`(없으면 undefined). */
export type SocialLinkOutcome =
  { status: "linked" } | { status: "failed"; reason?: string };
