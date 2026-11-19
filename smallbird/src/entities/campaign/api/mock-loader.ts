// API가 연결되기 전까지는 개발 서버에서만 목이 응답함(목 응답도 Zod로 검증해 실제 응답과 같은 길을 지남).
// 배포 빌드에서는 목을 번들에 넣지 않으려고 동적 import로 둠.

const MOCK_UNAVAILABLE = "The campaign API is not available yet.";

// 배포 빌드에서 목 모듈이 번들에 들어가지 않도록 import를 DEV 조건 안에 직접 둠(함수로 감싸면 제거되지 않음).
export async function loadCampaignListMock() {
  if (import.meta.env.DEV) return import("./mock/campaign-mock");
  throw new Error(MOCK_UNAVAILABLE);
}

export async function loadCampaignDetailMock() {
  if (import.meta.env.DEV) return import("./mock/campaign-detail-mock");
  throw new Error(MOCK_UNAVAILABLE);
}

/** 서버 연동 모드에서 서버에 없는 기능을 흉내 낼 그림자 저장소. 배포 빌드에는 없음. */
export async function loadCampaignShadowMock() {
  if (import.meta.env.DEV) return import("./mock/campaign-shadow");
  throw new Error(MOCK_UNAVAILABLE);
}
