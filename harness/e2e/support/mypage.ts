import { masterSession, type MockApi } from "./api";

/** 계정 설정(`/mypage/account`) 탭들이 읽는 API에 MASTER 기준 응답을 정한다. */
export function mockMypageAccount(api: MockApi) {
  api.json("GET", "/server/v3/sec", masterSession);
  api.json("GET", "/server/v3/mypage/account/master", {
    result: true,
    user: {
      identifier: "tester",
      email: "test@example.com",
      certification: { certIdx: 1, name: "홍길동", phoneNumber: "01012345678" },
      created: "2024-01-01 10:00",
    },
  });
  api.json("GET", "/server/v3/mypage/account/profile", { profileUrl: null });
  api.json("GET", "/server/v3/mypage/account/agreement", {
    alimAdInfoAgree: true,
    alimNightAgree: false,
    pushAdInfoAgree: true,
    pushNightAgree: false,
  });
  api.json("GET", "/server/v3/mypage/account/sub", {
    sub: [{ idx: 9000, identifier: "sub01", name: "김담당" }],
    pagingInfo: { page: 1, size: 8, totalCount: 1, totalPage: 1 },
  });
}

/** 빅버드 머니(`/mypage/money`)가 읽는 API에 응답을 정한다. 내역은 비워 둔다. */
export function mockMypageMoney(api: MockApi) {
  api.json("GET", "/server/v3/mypage/bigbird-money", {
    bigbirdMoney: 10000,
    withdrawable: true,
    withdrawUnavailableReason: null,
  });
  const emptyPage = { list: [], count: 0, currentPage: 1, entrySize: 10 };
  api.json("POST", "/server/v3/mypage/bigbird-money/charge", emptyPage);
  api.json("POST", "/server/v3/mypage/bigbird-money/usage", emptyPage);
  api.json("GET", "/server/v3/mypage/bigbird-money/usage/filter-options", {
    campaigns: [],
    usageDetails: [],
  });
}
