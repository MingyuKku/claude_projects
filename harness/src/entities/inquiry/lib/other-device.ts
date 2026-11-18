/**
 * 매칭된 실시간 채팅방에 다른 기기로 들어온 경우(가이드 2026-11-03 5번 채팅방 잠금): 채팅 REST는 409, 상담 문서 구독은
 * Firestore 권한 오류(permission-denied)로 거절됨. 화면은 "다른 기기에서 상담 중" 안내만 띄움.
 */
export function isOtherDeviceError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  // ApiError(status)와 FirebaseError(code)를 모양으로 가림. shared/api 목업 테스트에서도 그대로 동작하게 함.
  if ("status" in error) return error.status === 409;
  return "code" in error && error.code === "permission-denied";
}
