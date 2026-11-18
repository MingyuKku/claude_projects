import { ApiError, serverApiV3 } from "@/shared/api";

import { createEmptyDraft } from "../model/draft";
import { deleteCampaign } from "./campaign-api";
import {
  completeCampaignDemo,
  convertCampaignDemo,
  copyCampaign,
  createCampaign,
  fetchCampaignDetail,
  payCampaign,
  saveCampaignStep,
} from "./campaign-detail-api";

import type { CampaignDraft } from "../model/draft";
import type * as SharedApi from "@/shared/api";
import type * as SharedConfig from "@/shared/config";

// 서버 연동 모드(전체 목 모드가 아님)에서 서버가 있는 API는 서버로 보내고, 없는 기능은 그림자 목이 처리하는지 검증함.
vi.mock("@/shared/config", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedConfig>()),
  isCampaignApiMock: () => false,
}));
vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mockGet = vi.mocked(serverApiV3.get);
const mockPost = vi.mocked(serverApiV3.post);
const mockPut = vi.mocked(serverApiV3.put);
const mockDelete = vi.mocked(serverApiV3.delete);

function liveDetail(overrides: Record<string, unknown> = {}) {
  return {
    campaignIdx: 7,
    serviceType: "PICK",
    productType: "BRAND",
    status: "DRAFT",
    demo: false,
    demoCompleted: false,
    info: {
      campaignCode: "PB-00000000000007",
      name: "봄 신제품",
      brandIdx: 3,
      brandName: "비글로우",
      campaignType: "PRODUCT_DELIVERY",
      startDate: "2099-01-01",
      endDate: "2099-01-31",
    },
    product: { productName: "톤업크림", quantityPerInfluencer: 1 },
    influencer: {
      platform: "INSTAGRAM",
      gender: "ALL",
      ageGroups: ["AGE_20S"],
      topics: ["Beauty"],
    },
    addOns: [],
    intro: {},
    conditions: { postingPeriodMonths: 3, secondaryCopyright: false },
    ...overrides,
  };
}

function draftWith(patch: (draft: CampaignDraft) => void) {
  const draft = createEmptyDraft();
  patch(draft);
  return draft;
}

async function readReason(promise: Promise<unknown>) {
  const error: unknown = await promise.then(
    () => undefined,
    (caught: unknown) => caught,
  );
  return (error as ApiError | undefined)?.data as
    { reason?: string } | undefined;
}

beforeEach(() => {
  window.sessionStorage.clear();
  vi.resetAllMocks();
});

describe("서버 연동 모드", () => {
  it("캠페인 생성은 서버로 보낸다", async () => {
    mockPost.mockResolvedValue({
      campaignIdx: 7,
      campaignCode: "PB-00000000000007",
    });

    const created = await createCampaign({
      serviceType: "PICK",
      productType: "BRAND",
      demo: true,
    });

    expect(mockPost).toHaveBeenCalledWith("/campaign", {
      serviceType: "PICK",
      productType: "BRAND",
      demo: true,
    });
    expect(created.campaignIdx).toBe(7);
  });

  it("상세는 서버가 생략한 값도 빈 값으로 채워 읽는다", async () => {
    mockGet.mockResolvedValue(liveDetail());

    const detail = await fetchCampaignDetail(7);

    expect(mockGet).toHaveBeenCalledWith("/campaign/7");
    expect(detail.draft.influencer.ageGroups).toEqual(["AGE_20S"]);
    expect(detail.draft.intro).toMatchObject({
      mainImage: null,
      detailMedia: [],
      titleHashtags: [],
    });
    expect(detail.draft.product.returnRequired).toBe(false);
  });

  it("1~6단계 저장은 단계 경로로 보내고 1단계는 종료일을 읽는다", async () => {
    mockPut.mockResolvedValue({ endDate: "2099-01-31" });

    await saveCampaignStep(
      7,
      "info",
      draftWith((draft) => {
        draft.info = {
          name: "봄 신제품",
          brandIdx: 3,
          campaignType: "PRODUCT_DELIVERY",
          startDate: "2099-01-01",
        };
      }),
    );
    mockPut.mockResolvedValue(undefined);
    await saveCampaignStep(
      7,
      "addOns",
      draftWith(() => {}),
    );

    expect(mockPut).toHaveBeenNthCalledWith(1, "/campaign/7/info", {
      name: "봄 신제품",
      brandIdx: 3,
      campaignType: "PRODUCT_DELIVERY",
      startDate: "2099-01-01",
    });
    expect(mockPut).toHaveBeenNthCalledWith(2, "/campaign/7/add-ons", {
      addOns: [],
    });
  });

  it("정책 동의는 서버로 보내지 않고 목이 상세에 덮어쓴다", async () => {
    mockGet.mockResolvedValue(liveDetail());

    await saveCampaignStep(
      7,
      "policy",
      draftWith((draft) => {
        draft.policy = {
          service: true,
          privacy: true,
          operation: true,
          reward: true,
        };
      }),
    );
    const detail = await fetchCampaignDetail(7);

    expect(mockPut).not.toHaveBeenCalled();
    expect(detail.draft.policy.reward).toBe(true);
  });

  it("목으로 결제한 캠페인은 승인 검토중으로 보이고 서버로 수정을 보내지 않는다", async () => {
    mockGet.mockResolvedValue(liveDetail());
    await saveCampaignStep(
      7,
      "policy",
      draftWith((draft) => {
        draft.policy = {
          service: true,
          privacy: true,
          operation: true,
          reward: true,
        };
      }),
    );

    const paid = await payCampaign(7, 0);
    const detail = await fetchCampaignDetail(7);
    const reason = await readReason(
      saveCampaignStep(
        7,
        "product",
        draftWith(() => {}),
      ),
    );

    expect(paid.status).toBe("REVIEWING");
    expect(detail.stage).toBe("REVIEWING");
    expect(detail.payment?.paidAmount).toBe(0);
    expect(reason).toEqual({ reason: "NOT_EDITABLE" });
    expect(mockPut).not.toHaveBeenCalled();
  });
});

describe("서버 연동 모드의 삭제", () => {
  it("서버의 삭제 API로 보낸다", async () => {
    mockDelete.mockResolvedValue(undefined);

    await deleteCampaign(7);

    expect(mockDelete).toHaveBeenCalledExactlyOnceWith("/campaign/7");
  });

  it("서버가 거절하면 reason을 그대로 전한다", async () => {
    mockDelete.mockRejectedValue(
      new ApiError(409, { reason: "NOT_DELETABLE", status: "REVIEWING" }),
    );

    expect(await readReason(deleteCampaign(7))).toEqual({
      reason: "NOT_DELETABLE",
      status: "REVIEWING",
    });
  });

  it("목으로 결제한 캠페인은 서버로 삭제를 보내지 않고 거절한다", async () => {
    mockGet.mockResolvedValue(liveDetail());
    await saveCampaignStep(
      7,
      "policy",
      draftWith((draft) => {
        draft.policy = {
          service: true,
          privacy: true,
          operation: true,
          reward: true,
        };
      }),
    );
    await payCampaign(7, 0);

    expect(await readReason(deleteCampaign(7))).toEqual({
      reason: "NOT_DELETABLE",
    });
    expect(mockDelete).not.toHaveBeenCalled();
  });
});

describe("서버 연동 모드의 이전 캠페인 불러오기", () => {
  it("복사 API 한 번으로 원본 번호를 보낸다", async () => {
    mockPost.mockResolvedValue(undefined);

    await copyCampaign(7, 5);

    expect(mockPost).toHaveBeenCalledExactlyOnceWith("/campaign/7/copy", {
      sourceCampaignIdx: 5,
    });
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("서버 오류의 reason을 그대로 전한다", async () => {
    mockPost.mockRejectedValue(
      new ApiError(404, { reason: "SOURCE_NOT_FOUND" }),
    );

    expect(await readReason(copyCampaign(7, 5))).toEqual({
      reason: "SOURCE_NOT_FOUND",
    });
  });
});

describe("서버 연동 모드의 데모 작성 완료", () => {
  it("서버의 작성 완료 API로 보낸다", async () => {
    mockPost.mockResolvedValue(undefined);

    await completeCampaignDemo(7);

    expect(mockPost).toHaveBeenCalledExactlyOnceWith(
      "/campaign/7/demo/complete",
    );
  });

  it("서버 오류의 reason과 빈 단계를 그대로 전한다", async () => {
    mockPost.mockRejectedValue(
      new ApiError(400, {
        reason: "INCOMPLETE_DRAFT",
        missingSteps: ["product", "intro"],
      }),
    );

    expect(await readReason(completeCampaignDemo(7))).toEqual({
      reason: "INCOMPLETE_DRAFT",
      missingSteps: ["product", "intro"],
    });
  });

  it("그림자가 있어도 서버가 완료한 데모는 작성 완료로 읽는다", async () => {
    mockGet.mockResolvedValue(liveDetail({ demo: true }));
    await saveCampaignStep(
      7,
      "policy",
      draftWith(() => {}),
    );
    mockPost.mockResolvedValue(undefined);

    await completeCampaignDemo(7);
    mockGet.mockResolvedValue(liveDetail({ demo: true, demoCompleted: true }));
    const detail = await fetchCampaignDetail(7);

    expect(detail.isDemoCompleted).toBe(true);
  });
});

describe("서버 연동 모드의 데모 전환", () => {
  it("서버의 전환 API로 보낸다", async () => {
    mockPost.mockResolvedValue(undefined);

    await convertCampaignDemo(7);

    expect(mockPost).toHaveBeenCalledExactlyOnceWith(
      "/campaign/7/demo/convert",
    );
  });

  it("서버 오류의 reason을 그대로 전한다", async () => {
    mockPost.mockRejectedValue(
      new ApiError(403, { reason: "SUBSCRIPTION_REQUIRED" }),
    );

    expect(await readReason(convertCampaignDemo(7))).toEqual({
      reason: "SUBSCRIPTION_REQUIRED",
    });
  });

  it("그림자가 있어도 전환한 캠페인은 실제 캠페인으로 읽는다", async () => {
    mockGet.mockResolvedValue(liveDetail({ campaignIdx: 9, demo: true }));
    await saveCampaignStep(
      9,
      "policy",
      draftWith((draft) => {
        draft.policy = {
          service: true,
          privacy: true,
          operation: true,
          reward: true,
        };
      }),
    );
    mockPost.mockResolvedValue(undefined);

    await completeCampaignDemo(9);
    await convertCampaignDemo(9);
    mockGet.mockResolvedValue(liveDetail({ campaignIdx: 9 }));
    const detail = await fetchCampaignDetail(9);

    expect(detail.isDemo).toBe(false);
    expect(detail.isDemoCompleted).toBe(false);
    expect(detail.draft.policy.service).toBe(false);
  });
});
