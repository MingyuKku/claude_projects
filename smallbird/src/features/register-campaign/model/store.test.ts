import { createDraftFixture } from "../lib/test-utils";
import { createCampaignRegisterStore, hasUnsavedChanges } from "./store";

function setup(overrides = {}) {
  const store = createCampaignRegisterStore(createDraftFixture(overrides));
  return { store, state: () => store.getState() };
}

describe("마법사 store", () => {
  it("서버 초안으로 시작하고 저장할 변경은 없다", () => {
    const { state } = setup();

    expect(state().draft.campaignCode).toBe("PB00000001001");
    expect(hasUnsavedChanges(state())).toBe(false);
  });

  it("캠페인마다 자기 상태를 갖는다", () => {
    const first = createCampaignRegisterStore(createDraftFixture());
    const second = createCampaignRegisterStore(createDraftFixture());

    first.getState().patchCampaignInfo({ name: "봄" });

    expect(second.getState().draft.campaignInfo.name).toBeNull();
  });

  it("입력을 고치면 다른 칸은 두고 저장할 변경이 생긴다", () => {
    const { store, state } = setup();

    store.getState().patchCampaignInfo({ name: "봄 체험" });
    store.getState().patchCampaignInfo({ startDate: "2026-12-01" });
    store.getState().patchInfluencer({ platform: "INSTAGRAM" });
    store.getState().setAddOns(["AI_POSTING_GUIDE"]);
    store.getState().patchIntro({ description: "설명" });
    store.getState().patchConditions({ headcount: 5 });
    store.getState().patchAgreements({ service: true });

    expect(state().draft).toMatchObject({
      campaignInfo: { name: "봄 체험", startDate: "2026-12-01" },
      influencer: { platform: "INSTAGRAM" },
      addOns: ["AI_POSTING_GUIDE"],
      intro: { description: "설명" },
      conditions: { headcount: 5 },
      policy: { agreements: { service: true, privacy: false } },
    });
    expect(hasUnsavedChanges(state())).toBe(true);
    expect(state().revision).toBe(7);
  });

  it("캠페인 유형을 바꾸면 2단계 입력과 리워드가 비워진다", () => {
    const { store, state } = setup({ serviceType: "RECRUIT" });
    store.getState().changeCampaignType("PRODUCT_DELIVERY");
    store.getState().patchProduct({ productName: "세트", productPrice: 5000 });
    store.getState().patchConditions({ rewardPerInfluencer: 1000 });

    store.getState().changeCampaignType("STORE_VISIT");

    expect(state().draft.campaignInfo.campaignType).toBe("STORE_VISIT");
    expect(state().draft.product.productName).toBeNull();
    expect(state().draft.conditions.rewardPerInfluencer).toBeNull();
  });

  it("협찬제품 금액을 내리면 대여 상품이 일반 상품으로 돌아가고, 링크를 고치면 URL 확인이 지워진다", () => {
    const { store, state } = setup();
    store.getState().patchProduct({ productPrice: 1_000_000, rental: true });
    store.getState().patchProduct({ productPrice: 10_000 });
    expect(state().draft.product.rental).toBe(false);

    store.getState().patchProduct({
      purchaseUrl: "https://a.example",
      purchaseUrlVerified: true,
    });
    store.getState().patchProduct({ purchaseUrl: "https://b.example" });
    expect(state().draft.product.purchaseUrlVerified).toBeNull();
  });

  it("가 본 단계를 남기되 이미 가 본 단계는 다시 남기지 않는다", () => {
    const { store, state } = setup();

    store.getState().markVisited("PRODUCT");
    store.getState().markVisited("PRODUCT");

    expect(state().draft.visitedSteps).toEqual(["PRODUCT"]);
    expect(state().revision).toBe(1);
  });

  it("저장 응답은 버전·저장 시각·종료일만 반영하고 그사이 입력한 값은 되돌리지 않는다", () => {
    const { store, state } = setup();
    store.getState().patchCampaignInfo({ name: "저장한 값" });
    const savingRevision = state().revision;
    store.getState().patchCampaignInfo({ name: "저장하는 동안 고친 값" });

    store
      .getState()
      .applySaveResult(
        { version: 2, updatedAt: "2026-11-06 10:01:00", endDate: "2026-12-31" },
        savingRevision,
      );

    expect(state().draft).toMatchObject({
      version: 2,
      updatedAt: "2026-11-06 10:01:00",
      campaignInfo: { name: "저장하는 동안 고친 값", endDate: "2026-12-31" },
    });
    // 저장을 보낸 뒤에 생긴 변경은 아직 저장되지 않은 상태로 남음.
    expect(hasUnsavedChanges(state())).toBe(true);
  });

  it("마지막 변경까지 저장되면 저장할 변경이 없다", () => {
    const { store, state } = setup();
    store.getState().patchCampaignInfo({ name: "봄" });

    store
      .getState()
      .applySaveResult(
        { version: 2, updatedAt: "2026-11-06 10:01:00", endDate: null },
        state().revision,
      );

    expect(hasUnsavedChanges(state())).toBe(false);
  });

  it("늦게 온 옛 저장 응답이 더 최근에 저장된 표시를 되돌리지 않는다", () => {
    const { store, state } = setup();
    store.getState().patchCampaignInfo({ name: "봄" });
    store.getState().patchCampaignInfo({ name: "여름" });
    const result = { version: 3, updatedAt: "t", endDate: null };

    store.getState().applySaveResult(result, 2);
    store.getState().applySaveResult(result, 1);

    expect(state().savedRevision).toBe(2);
  });

  it("서버가 저장한 초안으로 통째로 바꾸면 저장할 변경이 남지 않는다", () => {
    const { store, state } = setup();
    store.getState().patchCampaignInfo({ name: "고치던 값" });
    const copied = createDraftFixture({ version: 5 });

    store.getState().replaceWithSavedDraft(copied);

    expect(state().draft).toBe(copied);
    expect(hasUnsavedChanges(state())).toBe(false);
  });
});
