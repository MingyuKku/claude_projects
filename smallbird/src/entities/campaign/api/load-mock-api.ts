/**
 * 캠페인 등록 API가 나오기 전까지 응답하는 목 모듈. 개발 서버(`import.meta.env.DEV`)에서만 불러오고, 그 밖의 빌드에서는
 * 이 호출이 던져서 목 코드가 번들에 들어가지 않음(stage·prod는 두 경로가 준비 중 화면이라 여기까지 오지 않음).
 * API가 나오면 각 fetcher를 실제 호출로 바꾸고 이 파일과 `mock/`을 지움.
 */
export async function loadMockCampaignApi() {
  if (!import.meta.env.DEV) {
    throw new Error("The campaign register API is not available yet.");
  }
  return import("./mock/campaign-mock-api");
}
