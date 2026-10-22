// 임시 목 데이터. Sub ID 목록 API가 공개되기 전까지 화면 구현 확인용으로만 씀(스펙 §1).
// 화면 구현이 끝나면 이 파일과 use-sub-accounts의 목 분기를 함께 지움.
// 개발 서버에서만 채우고 빌드(stage·prod)에서는 빈 목록이라 번들에 목 값이 들어가지 않음.
import type { SubAccountViewModel } from "./types";

const NAMES = ["김담당", "이마케팅", "박운영", "최기획", "정디자인", "한영업"];

export const MOCK_SUB_ACCOUNTS: SubAccountViewModel[] = import.meta.env.DEV
  ? Array.from({ length: 23 }, (_, index) => {
      const number = String(index + 1).padStart(2, "0");
      return {
        accountIdx: 9000 + index,
        identifier: `sub${number}`,
        name: NAMES[index % NAMES.length]!,
        email: `sub${number}@bigbird.com`,
        createdAt: new Date(2024, 4, 10 - (index % 9)),
      };
    })
  : [];
