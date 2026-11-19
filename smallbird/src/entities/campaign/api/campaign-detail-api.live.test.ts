import { ApiError, serverApiV3 } from "@/shared/api";

import { createEmptyDraft } from "../model/draft";
import { deleteCampaign } from "./campaign-api";
import {
  cancelCampaignApproval,
  completeCampaignDemo,
  convertCampaignDemo,
  copyCampaign,
  createCampaign,
  fetchCampaignDetail,
  payCampaign,
  requestCampaignReapproval,
  reviewCampaignForDev,
  saveCampaignStep,
} from "./campaign-detail-api";

import type { CampaignDraft } from "../model/draft";
import type * as SharedApi from "@/shared/api";
import type * as SharedConfig from "@/shared/config";

// 서버 연동 모드(전체 목 모드가 아님)에서 서버가 있는 API는 서버로 보내는지 검증함(데모 상태는 그림자 목이 덧씌울 수 있음).
vi.mock("@/shared/config", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedConfig>()),
  isCampaignApiMock: () => false,
}));
vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const AGREED = { service: true, privacy: true, operation: true, reward: true };

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
    expect(detail.draft.creator.ageGroups).toEqual(["AGE_20S"]);
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

  it("정책 동의는 저장하지 않고 서버로도 보내지 않는다", async () => {
    await saveCampaignStep(
      7,
      "policy",
      draftWith((draft) => {
        draft.policy = { ...AGREED };
      }),
    );

    expect(mockPut).not.toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("결제는 서버로 보내고 총액과 정책 동의를 함께 실어 보낸다", async () => {
    const paidAt = "2099-01-01 10:00:00";
    mockPost.mockResolvedValue({
      status: "REVIEWING",
      paidAmount: 11_000,
      paidAt,
      balance: 5_000,
    });

    const paid = await payCampaign(7, {
      expectedTotalAmount: 11_000,
      agreements: AGREED,
    });

    expect(mockPost).toHaveBeenCalledExactlyOnceWith("/campaign/7/payment", {
      expectedTotalAmount: 11_000,
      agreements: AGREED,
    });
    expect(paid).toEqual({
      status: "REVIEWING",
      paidAmount: 11_000,
      paidAt,
      balance: 5_000,
    });
  });

  it("결제가 거절되면 reason과 서버 계산 금액을 그대로 전한다", async () => {
    mockPost.mockRejectedValue(
      new ApiError(409, { reason: "AMOUNT_CHANGED", totalAmount: 11_000 }),
    );

    expect(
      await readReason(
        payCampaign(7, { expectedTotalAmount: 10_000, agreements: AGREED }),
      ),
    ).toEqual({ reason: "AMOUNT_CHANGED", totalAmount: 11_000 });
  });

  it("재승인 요청은 서버로 보내고 정책 동의 4개를 함께 싣는다", async () => {
    mockPost.mockResolvedValue({ status: "REVIEWING" });

    const result = await requestCampaignReapproval(7, AGREED);

    expect(mockPost).toHaveBeenCalledExactlyOnceWith("/campaign/7/approval", {
      agreements: AGREED,
    });
    expect(result).toEqual({ status: "REVIEWING" });
  });

  it("재승인 요청이 거절되면 reason을 그대로 전한다", async () => {
    mockPost.mockRejectedValue(
      new ApiError(400, { reason: "POLICY_NOT_AGREED" }),
    );

    expect(
      await readReason(
        requestCampaignReapproval(7, { ...AGREED, reward: false }),
      ),
    ).toEqual({ reason: "POLICY_NOT_AGREED" });
  });

  it("승인 요청 취소는 서버로 보내고 환불 금액을 읽는다", async () => {
    mockPost.mockResolvedValue({
      status: "DRAFT",
      refundedAmount: 11_000,
      balance: 16_000,
    });

    const result = await cancelCampaignApproval(7);

    expect(mockPost).toHaveBeenCalledExactlyOnceWith(
      "/campaign/7/payment/cancel",
    );
    expect(result).toEqual({
      status: "DRAFT",
      refundedAmount: 11_000,
      balance: 16_000,
    });
  });

  it("승인 요청 취소가 거절되면 reason과 현재 상태를 그대로 전한다", async () => {
    mockPost.mockRejectedValue(
      new ApiError(409, { reason: "NOT_CANCELABLE", status: "IN_PROGRESS" }),
    );

    expect(await readReason(cancelCampaignApproval(7))).toEqual({
      reason: "NOT_CANCELABLE",
      status: "IN_PROGRESS",
    });
  });

  it("개발용 승인·반려는 stage 전용 API로 보낸다", async () => {
    mockPost.mockResolvedValue(undefined);

    await reviewCampaignForDev(7, { type: "approve" });
    await reviewCampaignForDev(7, { type: "reject", reason: "금액 확인" });

    expect(mockPost).toHaveBeenNthCalledWith(1, "/campaign/7/test/approve");
    expect(mockPost).toHaveBeenNthCalledWith(2, "/campaign/7/test/reject", {
      rejectReason: "금액 확인",
    });
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
