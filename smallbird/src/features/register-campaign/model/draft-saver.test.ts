import { createEmptyDraft, saveCampaignStep } from "@/entities/campaign";
import { ApiError } from "@/shared/api";

import { createDraftSaver, getChangedSteps } from "./draft-saver";
import { createRegisterWizardStore } from "./store";

import type { CampaignDetail } from "@/entities/campaign";

vi.mock("@/entities/campaign", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  saveCampaignStep: vi.fn(),
}));

function createStore() {
  const draft = createEmptyDraft();
  return createRegisterWizardStore({
    campaignIdx: 7,
    campaignCode: "PB-00000000000007",
    serviceType: "PICK",
    productType: "BRAND",
    isDemo: false,
    draft,
  } as CampaignDetail);
}

beforeEach(() => {
  vi.mocked(saveCampaignStep).mockReset().mockResolvedValue(undefined);
});

describe("getChangedSteps", () => {
  it("바뀐 단계만 단계 순서대로 고르고, 연령대·주제가 빈 3단계는 건너뛴다", () => {
    const store = createStore();
    store.getState().patchStepDraft("conditions", { postingPeriodMonths: 3 });
    store.getState().patchStepDraft("influencer", { platform: "INSTAGRAM" });
    store.getState().patchStepDraft("info", { name: "캠페인" });

    expect(getChangedSteps(store.getState())).toEqual(["info", "conditions"]);

    store.getState().patchStepDraft("influencer", {
      ageGroups: ["AGE_20S"],
      topics: ["Beauty"],
    });
    expect(getChangedSteps(store.getState())).toEqual([
      "info",
      "influencer",
      "conditions",
    ]);
  });
});

describe("createDraftSaver", () => {
  it("바뀐 단계를 하나씩 보내고 저장한 값으로 표시한 뒤 상세를 다시 읽는다", async () => {
    const store = createStore();
    const onSaved = vi.fn().mockResolvedValue(undefined);
    const saver = createDraftSaver(store, onSaved);
    store.getState().patchStepDraft("info", { name: "캠페인" });

    expect(saver.hasChanges()).toBe(true);
    await expect(saver.save()).resolves.toEqual({ ok: true });

    expect(saveCampaignStep).toHaveBeenCalledTimes(1);
    expect(saveCampaignStep).toHaveBeenCalledWith(7, "info", expect.anything());
    expect(saver.hasChanges()).toBe(false);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("바뀐 것이 없으면 요청 없이 성공하고 상세도 다시 읽지 않는다", async () => {
    const onSaved = vi.fn();
    const saver = createDraftSaver(createStore(), onSaved);

    await expect(saver.save()).resolves.toEqual({ ok: true });
    expect(saveCampaignStep).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("저장 중에 생긴 변경은 앞 저장이 끝난 뒤 이어서 보낸다", async () => {
    const store = createStore();
    let finishFirst: () => void = () => {};
    vi.mocked(saveCampaignStep).mockImplementationOnce(
      () => new Promise((resolve) => (finishFirst = () => resolve(undefined))),
    );
    const saver = createDraftSaver(store, () => Promise.resolve());
    store.getState().patchStepDraft("info", { name: "처음" });

    const first = saver.save();
    await vi.waitFor(() => expect(saveCampaignStep).toHaveBeenCalledTimes(1));
    store.getState().patchStepDraft("info", { name: "고친 값" });
    const second = saver.save();
    expect(saveCampaignStep).toHaveBeenCalledTimes(1);

    finishFirst();
    await first;
    await second;

    expect(saveCampaignStep).toHaveBeenCalledTimes(2);
    expect(vi.mocked(saveCampaignStep).mock.calls[1]?.[2].info.name).toBe(
      "고친 값",
    );
  });

  it("실패하면 서버 사유를 돌려주고 저장 표시를 하지 않는다", async () => {
    const store = createStore();
    vi.mocked(saveCampaignStep).mockRejectedValueOnce(
      new ApiError(409, { reason: "NOT_EDITABLE" }),
    );
    const saver = createDraftSaver(store, () => Promise.resolve());
    store.getState().patchStepDraft("info", { name: "캠페인" });

    await expect(saver.save()).resolves.toEqual({
      ok: false,
      reason: "NOT_EDITABLE",
    });
    expect(saver.hasChanges()).toBe(true);
  });

  it("저장된 유형을 바꿔 1단계를 저장하면 서버가 비운 2~6단계를 저장된 값에서도 비운다", async () => {
    const store = createStore();
    const saver = createDraftSaver(store, () => Promise.resolve());
    store
      .getState()
      .patchStepDraft("info", { campaignType: "PRODUCT_DELIVERY" });
    store.getState().patchStepDraft("product", { productName: "앰플" });
    await saver.save();
    expect(store.getState().savedDraft.product.productName).toBe("앰플");

    store.getState().patchStepDraft("info", { campaignType: "PRESS" });
    store.getState().setStepDraft("product", createEmptyDraft().product);
    vi.mocked(saveCampaignStep).mockClear();
    await saver.save();

    expect(saveCampaignStep).toHaveBeenCalledTimes(1);
    expect(store.getState().savedDraft.product.productName).toBe("");
  });
});
