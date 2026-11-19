import { createEmptyDraft, saveCampaignStep } from "@/entities/campaign";
import { ApiError } from "@/shared/api";

import { uploadCampaignFile } from "../api/upload-campaign-file";
import { applyDraftDefaults } from "./draft-defaults";
import { createDraftSaver, getChangedSteps } from "./draft-saver";
import { createPendingMedia } from "./pending-media";
import { createRegisterWizardStore } from "./store";

import type { CampaignDetail } from "@/entities/campaign";

vi.mock("@/entities/campaign", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  saveCampaignStep: vi.fn(),
}));

// 서버에 기본 선택까지 저장된 캠페인. 기본값을 채우느라 바뀐 단계가 없는 상태로 시작함.
function createStore(draft = applyDraftDefaults(createEmptyDraft())) {
  return createRegisterWizardStore({
    campaignIdx: 7,
    campaignCode: "PB-00000000000007",
    serviceType: "PICK",
    productType: "BRAND",
    isDemo: false,
    rawCampaignType: draft.info.campaignType,
    draft,
  } as CampaignDetail);
}

vi.mock("../api/upload-campaign-file", () => ({
  uploadCampaignFile: vi.fn(),
}));

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
  vi.mocked(uploadCampaignFile).mockReset();
  vi.mocked(saveCampaignStep).mockReset().mockResolvedValue(undefined);
});

describe("getChangedSteps", () => {
  it("바뀐 단계만 단계 순서대로 고른다", () => {
    const store = createStore();
    store.getState().patchStepDraft("conditions", { postingPeriodMonths: 3 });
    store.getState().patchStepDraft("creator", { platform: "YOUTUBE" });
    store.getState().patchStepDraft("info", { name: "캠페인" });

    expect(getChangedSteps(store.getState())).toEqual([
      "info",
      "creator",
      "conditions",
    ]);
  });

  it("정책 동의만 바뀌면 저장할 단계가 없고 저장 요청도 보내지 않는다", async () => {
    const store = createStore();
    store.getState().patchStepDraft("policy", { service: true });
    const saver = createDraftSaver(store, () => Promise.resolve());

    expect(getChangedSteps(store.getState())).toEqual([]);
    expect(saver.hasChanges()).toBe(false);
    expect(await saver.save()).toEqual({ ok: true });
    expect(saveCampaignStep).not.toHaveBeenCalled();
  });

  it("서버에 값이 없어 기본 선택으로 채운 단계도 저장할 단계로 고른다", () => {
    const store = createStore(createEmptyDraft());

    expect(getChangedSteps(store.getState())).toEqual([
      "info",
      "creator",
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

    // 서버가 비운 3·6단계는 화면의 기본 선택과 달라져서 이어서 다시 저장함.
    expect(
      vi.mocked(saveCampaignStep).mock.calls.map(([, step]) => step),
    ).toEqual(["info", "creator", "conditions"]);
    expect(store.getState().savedDraft.product.productName).toBe("");
  });

  describe("5단계 파일 올리기", () => {
    const file = new File(["x"], "a.png", { type: "image/png" });

    it("5단계를 저장하기 전에 올리지 않은 파일을 올리고 받은 번호로 바꿔 저장한다", async () => {
      vi.mocked(uploadCampaignFile).mockResolvedValue({
        attachmentIdx: 31,
        url: "https://s3/a.png",
        mediaType: "IMAGE",
      });
      const store = createStore();
      const saver = createDraftSaver(store, () => Promise.resolve());
      store
        .getState()
        .patchStepDraft("intro", { mainImage: createPendingMedia(file) });

      await expect(saver.save()).resolves.toEqual({ ok: true });

      expect(uploadCampaignFile).toHaveBeenCalledWith(file);
      const saved = vi
        .mocked(saveCampaignStep)
        .mock.calls.find(([, step]) => step === "intro")?.[2];
      expect(saved?.intro.mainImage).toEqual({
        attachmentIdx: 31,
        url: "https://s3/a.png",
        mediaType: "IMAGE",
      });
      expect(store.getState().uploadProgress).toBeNull();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
    });

    it("올리기에 실패하면 사유를 돌려주고 5단계를 저장하지 않으며, 다시 저장하면 실패한 파일만 올린다", async () => {
      const second = new File(["y"], "b.png", { type: "image/png" });
      vi.mocked(uploadCampaignFile)
        .mockResolvedValueOnce({
          attachmentIdx: 1,
          url: "u1",
          mediaType: "IMAGE",
        })
        .mockRejectedValueOnce(new ApiError(400, { reason: "FILE_TOO_LARGE" }));
      const store = createStore();
      const saver = createDraftSaver(store, () => Promise.resolve());
      store.getState().patchStepDraft("intro", {
        detailMedia: [createPendingMedia(file), createPendingMedia(second)],
      });

      await expect(saver.save()).resolves.toEqual({
        ok: false,
        reason: "FILE_TOO_LARGE",
        isUploadFailure: true,
      });
      expect(
        vi
          .mocked(saveCampaignStep)
          .mock.calls.some(([, step]) => step === "intro"),
      ).toBe(false);
      expect(store.getState().uploadProgress).toBeNull();

      vi.mocked(uploadCampaignFile).mockResolvedValueOnce({
        attachmentIdx: 2,
        url: "u2",
        mediaType: "IMAGE",
      });
      await expect(saver.save()).resolves.toEqual({ ok: true });

      expect(uploadCampaignFile).toHaveBeenCalledTimes(3);
      expect(vi.mocked(uploadCampaignFile).mock.calls[2]?.[0]).toBe(second);
      expect(
        store
          .getState()
          .savedDraft.intro.detailMedia.map((m) => m.attachmentIdx),
      ).toEqual([1, 2]);
    });

    it("올리는 사이 파일을 지워 저장할 것이 없어지면 5단계를 보내지 않는다", async () => {
      vi.mocked(saveCampaignStep).mockClear();
      const store = createStore();
      const saver = createDraftSaver(store, () => Promise.resolve());
      vi.mocked(uploadCampaignFile).mockImplementation(async () => {
        store.getState().patchStepDraft("intro", { mainImage: null });
        return { attachmentIdx: 5, url: "u", mediaType: "IMAGE" as const };
      });
      store
        .getState()
        .patchStepDraft("intro", { mainImage: createPendingMedia(file) });
      await saver.save();

      expect(
        vi
          .mocked(saveCampaignStep)
          .mock.calls.some(([, step]) => step === "intro"),
      ).toBe(false);
    });
  });

  describe("올리기 전 파일의 미리보기 주소", () => {
    const file = new File(["x"], "a.png", { type: "image/png" });

    it("올리는 동안 진행을 알리고 한 번에 최대 3개씩 올린다", async () => {
      const store = createStore();
      const progress: (number | undefined)[] = [];
      store.subscribe((state) => progress.push(state.uploadProgress?.done));
      let running = 0;
      let maxRunning = 0;
      vi.mocked(uploadCampaignFile).mockImplementation(async () => {
        running += 1;
        maxRunning = Math.max(maxRunning, running);
        await new Promise((resolve) => setTimeout(resolve, 5));
        running -= 1;
        return { attachmentIdx: 1, url: "u", mediaType: "IMAGE" as const };
      });
      store.getState().patchStepDraft("intro", {
        detailMedia: Array.from({ length: 5 }, () => createPendingMedia(file)),
      });

      await createDraftSaver(store, () => Promise.resolve()).save();

      expect(maxRunning).toBe(3);
      expect(progress).toContain(5);
      expect(store.getState().uploadProgress).toBeNull();
    });

    it("이전 캠페인 불러오기·유형 변경·AI 결과로 버려지는 파일은 주소를 놓아 준다", () => {
      const store = createStore();
      store
        .getState()
        .patchStepDraft("intro", { mainImage: createPendingMedia(file) });
      store.getState().replaceDraft(applyDraftDefaults(createEmptyDraft()));
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);

      store
        .getState()
        .patchStepDraft("intro", { mainImage: createPendingMedia(file) });
      store.getState().changeCampaignType("PRESS");
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);

      store
        .getState()
        .patchStepDraft("intro", { mainImage: createPendingMedia(file) });
      const jobId = store.getState().startIntroGeneration();
      store.getState().finishIntroGeneration(jobId, createEmptyDraft().intro);
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
    });

    it("올리는 사이 불러오기 등으로 버려진 파일의 결과는 반영하지 않는다", () => {
      const store = createStore();
      store.getState().resolvePendingMedia(file, {
        attachmentIdx: 1,
        url: "u",
        mediaType: "IMAGE",
      });

      expect(store.getState().draft.intro.mainImage).toBeNull();
      expect(store.getState().draft.intro.detailMedia).toEqual([]);
    });
  });
});
