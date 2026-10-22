import type { AccountProfileViewModel } from "./mypage-schema";

// Sub ID 본인 정보 조회 API가 공개되기 전 목(스펙 §7 B-3). API가 나오면 이 파일과 훅의 목 분기를 지움.
export const MOCK_SUB_SELF_PROFILE: AccountProfileViewModel = {
  identifier: "sub01",
  name: "김담당",
  phone: "01012345678",
  email: "sub01@bigbird.com",
  joinedAt: new Date(2024, 4, 10),
  certIdx: null,
};
