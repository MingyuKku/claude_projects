import { ApiError } from "@/shared/api";

import {
  cancelCampaignApproval,
  copyPreviousCampaign,
  createCampaignDraft,
  fetchCampaign,
  fetchCampaignDraft,
  payCampaign,
  requestCampaignReapproval,
  saveCampaignDraft,
  searchPreviousCampaigns,
  testReviewCampaign,
} from "./campaign-api";
import { campaignMockDb } from "./mock/campaign-mock-db";

import type { CampaignDraft } from "../model/schema";

beforeEach(() => {
  campaignMockDb.reset();
  window.sessionStorage.clear();
});

async function reasonOf(promise: Promise<unknown>) {
  const error = await promise.then(
    () => undefined,
    (thrown: unknown) => thrown,
  );
  expect(error).toBeInstanceOf(ApiError);
  const apiError = error as ApiError;
  return { status: apiError.status, data: apiError.data };
}

describe("목 캠페인 API", () => {
  it("초안을 만들면 캠페인 코드가 발급되고 등록 중이며 값은 비어 있다", async () => {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });

    expect(draft).toMatchObject({
      campaignIdx: 1001,
      campaignCode: "PB00000001001",
      status: "DRAFT",
      version: 1,
      visitedSteps: [],
    });
    expect(draft.campaignInfo.name).toBeNull();
    expect((await fetchCampaignDraft(1001)).campaignCode).toBe("PB00000001001");
  });

  it("모집형은 다른 접두사의 코드를 받고 초안마다 번호가 오른다", async () => {
    await createCampaignDraft({ serviceType: "PICK", productType: "BRAND" });
    const second = await createCampaignDraft({
      serviceType: "RECRUIT",
      productType: "BRAND",
    });

    expect(second.campaignIdx).toBe(1002);
    expect(second.campaignCode).toBe("RC00000001002");
  });

  it("없는 캠페인은 404 CAMPAIGN_NOT_FOUND다", async () => {
    expect(await reasonOf(fetchCampaignDraft(999))).toEqual({
      status: 404,
      data: { result: false, reason: "CAMPAIGN_NOT_FOUND" },
    });
  });

  it("저장하면 입력값이 남고 버전이 오르며 종료일은 시작일 + 30일이다", async () => {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });
    const edited = {
      ...draft,
      visitedSteps: ["CAMPAIGN_INFO" as const],
      campaignInfo: {
        ...draft.campaignInfo,
        name: "봄 신제품 체험",
        startDate: "2026-11-10",
      },
    };

    const result = await saveCampaignDraft(edited);

    expect(result).toMatchObject({ version: 2, endDate: "2026-12-10" });
    const saved = await fetchCampaignDraft(draft.campaignIdx);
    expect(saved).toMatchObject({
      version: 2,
      visitedSteps: ["CAMPAIGN_INFO"],
      campaignInfo: {
        name: "봄 신제품 체험",
        startDate: "2026-11-10",
        endDate: "2026-12-10",
      },
    });
  });

  it("오래된 버전으로 저장하면 409 VERSION_CONFLICT다", async () => {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });
    await saveCampaignDraft(draft);

    expect(await reasonOf(saveCampaignDraft(draft))).toMatchObject({
      status: 409,
      data: { reason: "VERSION_CONFLICT" },
    });
  });

  it("승인 검토중인 캠페인은 저장할 수 없다(409 NOT_EDITABLE)", async () => {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });
    campaignMockDb.update((db) => {
      const target = db.campaigns[draft.campaignIdx];
      if (target) target.status = "REVIEWING";
    });

    expect(await reasonOf(saveCampaignDraft(draft))).toMatchObject({
      status: 409,
      data: { reason: "NOT_EDITABLE" },
    });
  });

  it("반려 중에는 부가서비스·인원·리워드를 바꿀 수 없다(409 LOCKED_FIELD)", async () => {
    const draft = await createCampaignDraft({
      serviceType: "RECRUIT",
      productType: "BRAND",
    });
    campaignMockDb.update((db) => {
      const target = db.campaigns[draft.campaignIdx];
      if (target) target.status = "REJECTED";
    });

    expect(
      await reasonOf(
        saveCampaignDraft({
          ...draft,
          status: "REJECTED",
          addOns: ["AI_POSTING_GUIDE"],
        }),
      ),
    ).toMatchObject({ status: 409, data: { reason: "LOCKED_FIELD" } });
    // 금액에 영향 없는 값은 저장된다.
    await expect(
      saveCampaignDraft({
        ...draft,
        status: "REJECTED",
        campaignInfo: { ...draft.campaignInfo, name: "수정" },
      }),
    ).resolves.toMatchObject({ version: 2 });
  });

  it("등록 내역에는 고른 브랜드가 붙는다", async () => {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });
    // `entities/brand`의 목 저장소가 남기는 값과 같은 모양.
    const brand = {
      brandIdx: 7,
      nameKo: "새 브랜드",
      nameEn: "New Brand",
      imageUrl: null,
    };
    window.sessionStorage.setItem(
      "bigbird:mock:brands",
      JSON.stringify({ nextBrandIdx: 8, brands: [brand] }),
    );
    await saveCampaignDraft({
      ...draft,
      campaignInfo: { ...draft.campaignInfo, brandIdx: brand.brandIdx },
    });

    const detail = await fetchCampaign(draft.campaignIdx);

    expect(detail.brand).toEqual(brand);
  });
});

describe("이전 캠페인", () => {
  const search = (
    overrides: Partial<Parameters<typeof searchPreviousCampaigns>[0]> = {},
  ) =>
    searchPreviousCampaigns({
      serviceType: "PICK",
      keyword: null,
      excludeCampaignIdx: 0,
      page: 1,
      entrySize: 20,
      ...overrides,
    });

  it("같은 서비스 유형의 캠페인만 등록일 최신순으로 준다", async () => {
    const result = await search();

    expect(result.list.map((item) => item.name)).toEqual([
      "신상 구매 리뷰",
      "매장 오픈 이벤트",
      "봄 신제품 체험",
    ]);
    expect(result).toMatchObject({ count: 3, currentPage: 1, entrySize: 20 });
  });

  it("캠페인명으로 찾고, 자기 자신과 이름이 없는 등록 중 캠페인은 뺀다", async () => {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });

    expect((await search({ keyword: "오픈" })).list).toHaveLength(1);
    expect((await search({ excludeCampaignIdx: 903 })).count).toBe(2);
    expect(
      (await search()).list.some(
        (item) => item.campaignIdx === draft.campaignIdx,
      ),
    ).toBe(false);
  });

  it("브랜드명으로도 찾는다", async () => {
    window.sessionStorage.setItem(
      "bigbird:mock:brands",
      JSON.stringify({
        brands: [
          { brandIdx: 2, nameKo: "초록숲", nameEn: "Green", imageUrl: null },
        ],
      }),
    );

    expect(
      (await search({ keyword: "초록" })).list.map((item) => item.name),
    ).toEqual(["매장 오픈 이벤트"]);
  });

  it("쪽을 나눠 준다", async () => {
    const second = await search({ page: 2, entrySize: 2 });

    expect(second.list).toHaveLength(1);
    expect(second.count).toBe(3);
  });

  it("고른 캠페인의 1~6단계 입력값을 복사하고 코드·약관 동의·가 본 단계는 새로 둔다", async () => {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });

    const copied = await copyPreviousCampaign(draft.campaignIdx, 901);

    expect(copied).toMatchObject({
      campaignCode: draft.campaignCode,
      version: 2,
      visitedSteps: [],
      campaignInfo: {
        name: "봄 신제품 체험",
        campaignType: "PRODUCT_DELIVERY",
      },
      product: { productName: "봄 신제품 세트", productPrice: 45000 },
      influencer: { platform: "INSTAGRAM" },
      addOns: ["AI_POSTING_GUIDE"],
      policy: {
        agreements: {
          service: false,
          privacy: false,
          operation: false,
          reward: false,
        },
      },
    });
  });

  it("서비스 유형이 다르면 400, 없는 원본은 404다", async () => {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });

    expect(
      await reasonOf(copyPreviousCampaign(draft.campaignIdx, 904)),
    ).toMatchObject({
      status: 400,
      data: { reason: "SERVICE_TYPE_MISMATCH" },
    });
    expect(
      await reasonOf(copyPreviousCampaign(draft.campaignIdx, 12345)),
    ).toMatchObject({
      status: 404,
      data: { reason: "SOURCE_NOT_FOUND" },
    });
  });
});

describe("개발 서버가 아닌 빌드", () => {
  beforeEach(() => vi.stubEnv("DEV", false));
  afterEach(() => vi.unstubAllEnvs());

  it("API가 없어서 목으로 응답하지 않고 던진다", async () => {
    await expect(
      createCampaignDraft({ serviceType: "PICK", productType: "BRAND" }),
    ).rejects.toThrow("not available");
  });
});

describe("결제와 승인", () => {
  async function recruitDraft(overrides: Partial<CampaignDraft> = {}) {
    const draft = await createCampaignDraft({
      serviceType: "RECRUIT",
      productType: "BRAND",
    });
    const input: CampaignDraft = {
      ...draft,
      campaignInfo: { ...draft.campaignInfo, campaignType: "PRODUCT_DELIVERY" },
      addOns: ["AI_POSTING_GUIDE", "AI_MANUSCRIPT_CONFIRM"],
      conditions: {
        ...draft.conditions,
        headcount: 10,
        rewardPerInfluencer: 3000,
      },
      policy: {
        agreements: {
          service: true,
          privacy: true,
          operation: true,
          reward: true,
        },
      },
      ...overrides,
    };
    await saveCampaignDraft(input);
    return input;
  }

  // 10,000(포스팅 가이드) + 5,000 × 10(원고컨펌) + 3,000 × 10(리워드)
  const TOTAL = 90_000;

  it("서버 계산과 같은 금액으로 결제하면 승인 검토중이 되고 결제 정보가 남는다", async () => {
    const draft = await recruitDraft();

    const result = await payCampaign(draft.campaignIdx, TOTAL);

    expect(result).toMatchObject({ status: "REVIEWING", paidAmount: TOTAL });
    expect(await fetchCampaign(draft.campaignIdx)).toMatchObject({
      status: "REVIEWING",
      payment: { paidAmount: TOTAL, method: "BIGBIRD_MONEY" },
      addOnPrices: [
        { code: "AI_POSTING_GUIDE", unitPrice: 10_000, unit: "FIXED" },
        {
          code: "AI_MANUSCRIPT_CONFIRM",
          unitPrice: 5_000,
          unit: "PER_INFLUENCER",
        },
      ],
    });
  });

  it("금액이 다르면 409 AMOUNT_CHANGED, 약관에 동의하지 않았으면 400 POLICY_NOT_AGREED다", async () => {
    const draft = await recruitDraft();
    const notAgreed = await recruitDraft({
      policy: {
        agreements: {
          service: true,
          privacy: true,
          operation: true,
          reward: false,
        },
      },
    });

    expect(
      await reasonOf(payCampaign(draft.campaignIdx, TOTAL - 1)),
    ).toMatchObject({
      status: 409,
      data: { reason: "AMOUNT_CHANGED" },
    });
    expect(
      await reasonOf(payCampaign(notAgreed.campaignIdx, TOTAL)),
    ).toMatchObject({
      status: 400,
      data: { reason: "POLICY_NOT_AGREED" },
    });
  });

  it("PICK형은 부가서비스를 고르지 않으면 0원이어도 결제가 승인 요청이 된다", async () => {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });
    await saveCampaignDraft({
      ...draft,
      policy: {
        agreements: {
          service: true,
          privacy: true,
          operation: true,
          reward: true,
        },
      },
    });

    await expect(payCampaign(draft.campaignIdx, 0)).resolves.toMatchObject({
      status: "REVIEWING",
      paidAmount: 0,
    });
  });

  it("이미 결제한 캠페인은 다시 결제할 수 없다(409 ALREADY_PAID)", async () => {
    const draft = await recruitDraft();
    await payCampaign(draft.campaignIdx, TOTAL);

    expect(await reasonOf(payCampaign(draft.campaignIdx, TOTAL))).toMatchObject(
      {
        status: 409,
        data: { reason: "ALREADY_PAID" },
      },
    );
  });

  it("승인 요청을 취소하면 환불하고 등록 중으로 돌아가 같은 코드로 다시 결제할 수 있다", async () => {
    const draft = await recruitDraft();
    await payCampaign(draft.campaignIdx, TOTAL);

    const cancelled = await cancelCampaignApproval(draft.campaignIdx);

    expect(cancelled).toMatchObject({ status: "DRAFT", refundedAmount: TOTAL });
    const detail = await fetchCampaign(draft.campaignIdx);
    expect(detail).toMatchObject({ status: "DRAFT", payment: null });
    expect(detail.campaignCode).toBe(draft.campaignCode);
    await expect(payCampaign(draft.campaignIdx, TOTAL)).resolves.toMatchObject({
      status: "REVIEWING",
    });
  });

  it("검토중이 아니면 취소할 수 없고 현재 상태를 알려 준다(409 NOT_CANCELABLE)", async () => {
    const draft = await recruitDraft();

    expect(
      await reasonOf(cancelCampaignApproval(draft.campaignIdx)),
    ).toMatchObject({
      status: 409,
      data: { reason: "NOT_CANCELABLE", status: "DRAFT" },
    });
  });

  it("심사에서 반려되면 사유가 붙고, 재승인을 요청하면 횟수가 줄며 재승인 검토중이 된다", async () => {
    const draft = await recruitDraft();
    await payCampaign(draft.campaignIdx, TOTAL);

    await testReviewCampaign(draft.campaignIdx, {
      result: "REJECT",
      rejections: [{ section: "PRODUCT", reason: "금액을 확인해주세요." }],
    });
    expect(await fetchCampaign(draft.campaignIdx)).toMatchObject({
      status: "REJECTED",
      rejections: [{ section: "PRODUCT", reason: "금액을 확인해주세요." }],
    });

    const result = await requestCampaignReapproval(draft.campaignIdx);

    expect(result).toEqual({ status: "RE_REVIEWING", reapprovalRemaining: 1 });
  });

  it("재승인 2회를 다 쓰면 409 REAPPROVAL_LIMIT이다", async () => {
    const draft = await recruitDraft();
    await payCampaign(draft.campaignIdx, TOTAL);
    const reject = () =>
      testReviewCampaign(draft.campaignIdx, {
        result: "REJECT",
        rejections: [],
      });

    await reject();
    await requestCampaignReapproval(draft.campaignIdx);
    await reject();
    await requestCampaignReapproval(draft.campaignIdx);
    await reject();

    expect(
      await reasonOf(requestCampaignReapproval(draft.campaignIdx)),
    ).toMatchObject({ status: 409, data: { reason: "REAPPROVAL_LIMIT" } });
  });

  it("승인되면 승인 완료이고 더는 취소·재승인 요청을 받지 않는다", async () => {
    const draft = await recruitDraft();
    await payCampaign(draft.campaignIdx, TOTAL);

    await testReviewCampaign(draft.campaignIdx, {
      result: "APPROVE",
      rejections: null,
    });

    expect((await fetchCampaign(draft.campaignIdx)).status).toBe("APPROVED");
    expect(
      await reasonOf(cancelCampaignApproval(draft.campaignIdx)),
    ).toMatchObject({
      data: { reason: "NOT_CANCELABLE" },
    });
    expect(
      await reasonOf(requestCampaignReapproval(draft.campaignIdx)),
    ).toMatchObject({ data: { reason: "NOT_REQUESTABLE" } });
  });
});
