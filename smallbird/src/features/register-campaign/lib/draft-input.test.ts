import { hasAnyInput, hasTypeDependentInput } from "./draft-input";
import { createDraftFixture } from "./test-utils";

describe("hasAnyInput", () => {
  it("아무것도 입력하지 않았으면 false다(서버가 정하는 종료일은 보지 않는다)", () => {
    const draft = createDraftFixture();

    expect(
      hasAnyInput({
        ...draft,
        campaignInfo: { ...draft.campaignInfo, endDate: "2026-12-10" },
      }),
    ).toBe(false);
  });

  it.each([
    ["캠페인명", { campaignInfo: { name: "봄" } }],
    ["제품 정보", { product: { productName: "세트" } }],
    ["플랫폼", { influencer: { platform: "INSTAGRAM" } }],
    ["부가서비스", { addOns: ["AI_POSTING_GUIDE"] }],
    ["소개서", { intro: { description: "설명" } }],
    ["진행 조건", { conditions: { headcount: 3 } }],
  ] as const)("%s이 있으면 true다", (_label, patch) => {
    const base = createDraftFixture();
    const draft = createDraftFixture(
      Object.fromEntries(
        Object.entries(patch).map(([key, value]) => [
          key,
          Array.isArray(value)
            ? value
            : { ...(base[key as keyof typeof base] as object), ...value },
        ]),
      ),
    );

    expect(hasAnyInput(draft)).toBe(true);
  });
});

describe("hasTypeDependentInput", () => {
  it("2단계 값이 있으면 true다", () => {
    const base = createDraftFixture();

    expect(
      hasTypeDependentInput(
        createDraftFixture({
          product: { ...base.product, storeName: "매장" },
        }),
      ),
    ).toBe(true);
  });

  it("리워드가 있으면 true다", () => {
    const base = createDraftFixture();

    expect(
      hasTypeDependentInput(
        createDraftFixture({
          conditions: { ...base.conditions, rewardPerInfluencer: 1000 },
        }),
      ),
    ).toBe(true);
  });

  it("진행 인원은 구매리뷰형일 때만 유형 전용 값이다", () => {
    const base = createDraftFixture();
    const conditions = { ...base.conditions, headcount: 5 };

    expect(hasTypeDependentInput(createDraftFixture({ conditions }))).toBe(
      false,
    );
    expect(
      hasTypeDependentInput(
        createDraftFixture({
          conditions,
          campaignInfo: {
            ...base.campaignInfo,
            campaignType: "PURCHASE_REVIEW",
          },
        }),
      ),
    ).toBe(true);
  });

  it("1단계·3~5단계 값만 있으면 false다", () => {
    const base = createDraftFixture();

    expect(
      hasTypeDependentInput(
        createDraftFixture({
          campaignInfo: { ...base.campaignInfo, name: "봄" },
          addOns: ["AI_POSTING_GUIDE"],
        }),
      ),
    ).toBe(false);
  });
});
