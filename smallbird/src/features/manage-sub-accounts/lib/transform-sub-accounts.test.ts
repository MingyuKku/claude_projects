import {
  subAccountAuthorizationSchema,
  subAccountListSchema,
} from "../model/schema";
import {
  applyPermissionChange,
  toAuthorizationBody,
  transformPermissions,
  transformSubAccountList,
} from "./transform-sub-accounts";

describe("transformSubAccountList", () => {
  it("목록과 쪽 정보를 뷰모델로 바꾸고 생성일을 날짜로 읽는다", () => {
    const page = transformSubAccountList(
      subAccountListSchema.parse({
        sub: [
          {
            idx: 101,
            userIdx: null,
            identifier: "sub01",
            name: "김서브",
            email: "sub01@bigbird.local",
            created: "2026-10-23T09:30:00",
            profileImageUrl: "https://cdn.bigbird.local/sub01.png",
          },
        ],
        pagingInfo: { page: 2, size: 8, totalCount: 9, totalPage: 2 },
      }),
    );
    expect(page).toEqual({
      accounts: [
        {
          accountIdx: 101,
          identifier: "sub01",
          name: "김서브",
          email: "sub01@bigbird.local",
          profileImageUrl: "https://cdn.bigbird.local/sub01.png",
          createdAt: new Date(2026, 9, 23, 9, 30),
        },
      ],
      totalCount: 9,
      page: 2,
      totalPages: 2,
    });
  });

  it("비어 있는 이름·이메일·생성일은 빈 값으로, 없는 목록은 빈 배열로 둔다", () => {
    const page = transformSubAccountList(
      subAccountListSchema.parse({
        sub: [{ idx: 7, identifier: "sub07", name: null, created: "" }],
        pagingInfo: { page: 1, size: 8, totalCount: 1, totalPage: 1 },
      }),
    );
    expect(page.accounts[0]).toEqual({
      accountIdx: 7,
      identifier: "sub07",
      name: "",
      email: "",
      profileImageUrl: null,
      createdAt: null,
    });

    const empty = transformSubAccountList(
      subAccountListSchema.parse({
        sub: null,
        pagingInfo: { page: 1, size: 8, totalCount: 0, totalPage: 0 },
      }),
    );
    expect(empty.accounts).toEqual([]);
  });
});

describe("권한 변환", () => {
  const authorization = subAccountAuthorizationSchema.parse({
    accountIdx: 101,
    isCampaignAccess: false,
    isInfluencerMatchingAccess: true,
    isInfluencerMarketAccess: false,
    isCommerceAccess: false,
    isBigbirdMoneyAccess: true,
    isPurchaserQuestionAccess: true,
  });

  it("v3 권한 6개를 표 순서대로 그린다", () => {
    expect(transformPermissions(authorization)).toEqual([
      { key: "campaign", isGranted: false },
      { key: "influencerMatching", isGranted: true },
      { key: "influencerMarket", isGranted: false },
      { key: "commerce", isGranted: false },
      { key: "bigbirdMoney", isGranted: true },
      { key: "buyerInquiry", isGranted: true },
    ]);
  });

  it("바꾼 권한만 새 값으로 바꾼다", () => {
    const current = transformPermissions(authorization);
    const next = applyPermissionChange(current, {
      key: "buyerInquiry",
      isGranted: false,
    });
    expect(
      next.find((permission) => permission.key === "buyerInquiry"),
    ).toEqual({ key: "buyerInquiry", isGranted: false });
    expect(next.filter((permission) => permission.isGranted)).toHaveLength(2);
    // 원래 배열은 그대로 둠(롤백에 씀).
    expect(
      current.find((permission) => permission.key === "buyerInquiry"),
    ).toEqual({ key: "buyerInquiry", isGranted: true });
  });

  it("저장 본문은 바꾼 권한만 서버 필드명으로 보낸다(부분 수정)", () => {
    expect(
      toAuthorizationBody(101, { key: "bigbirdMoney", isGranted: false }),
    ).toEqual({ accountIdx: 101, isBigbirdMoneyAccess: false });
  });
});
