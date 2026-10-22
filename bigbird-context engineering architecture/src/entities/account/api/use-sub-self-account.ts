import { MOCK_SUB_SELF_PROFILE } from "../model/mock-sub-self";

/**
 * Sub ID 본인 정보(아이디·담당자명·휴대폰·이메일·가입일). `GET /master`는 Sub ID에 403이고
 * 본인 정보 조회 API가 아직 없어 목 데이터를 돌려줌(스펙 §7 B-3).
 */
export function useSubSelfAccount() {
  return {
    profile: MOCK_SUB_SELF_PROFILE,
    isLoading: false,
    isError: false,
    // 저장 뒤 다시 읽을 조회가 없어 비워 둠. API가 나오면 SWR mutate로 바꿈.
    refresh: () => undefined,
  };
}
