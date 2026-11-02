/** 카카오톡 상담 채널. 문의 패널과 계정 잠금 안내가 함께 씀. */
export const KAKAO_CHAT_URL = "http://pf.kakao.com/_FvvFj/chat";

/** 회원 백엔드가 쓰는 서비스 번호(client=1, brands=2, influencer=3, market=4). */
export const SERVICE_INDEX = 1;

/**
 * 통합 인증 서버 `/lookup`에 보내는 `serviceId`. 1 = 빅버드 광고주.
 * UI가 보내는 값을 고정할 뿐이며, 서비스 간 격리는 이 상수가 아니라
 * 인증 서버가 serviceId로 걸러 내는 데 달려 있음.
 */
export const AUTH_SERVICE_ID = 1;

/** KMC 본인인증 초기화 슬러그(`/cert/init/{slug}`). 숫자가 아니라 문자열. */
export const CERT_SLUG = "client";
