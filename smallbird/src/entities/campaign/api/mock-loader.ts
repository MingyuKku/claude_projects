// API가 연결되기 전까지는 개발 서버에서만 목이 응답함(목 응답도 Zod로 검증해 실제 응답과 같은 길을 지남).
// 배포 빌드에서는 목을 번들에 넣지 않으려고 동적 import로 둠.

function assertMockAvailable() {
  if (!import.meta.env.DEV) {
    throw new Error("The campaign API is not available yet.");
  }
}

export async function loadCampaignListMock() {
  assertMockAvailable();
  return import("./mock/campaign-mock");
}

export async function loadCampaignDetailMock() {
  assertMockAvailable();
  return import("./mock/campaign-detail-mock");
}

/** 서버 연동 모드에서 서버에 없는 기능을 흉내 낼 그림자 저장소. 배포 빌드에는 없음. */
export async function loadCampaignShadowMock() {
  assertMockAvailable();
  return import("./mock/campaign-shadow");
}
