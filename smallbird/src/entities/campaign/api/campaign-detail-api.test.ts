import { isApiError } from "@/shared/api";
import { mockBrandDb, registerMockFile } from "@/shared/lib";

import { createEmptyDraft } from "../model/draft";
import {
  copyCampaign,
  createCampaign,
  fetchCampaignDetail,
  saveCampaignStep,
} from "./campaign-detail-api";

import type { CampaignDraft } from "../model/draft";

// 시드 캠페인 번호(mock/campaign-seeds): 3 PICK형 작성 완료 데모 · 4 모집형 반려 · 6 PICK형 승인 검토중(브랜드 2 초록숲, 모두 입력됨)
const DEMO_COMPLETED_IDX = 3;
const REJECTED_IDX = 4;
const PICK_REVIEWING_IDX = 6;
const RECRUIT_REVIEWING_IDX = 5;

beforeEach(() => window.sessionStorage.clear());

async function readReason(promise: Promise<unknown>) {
  const error: unknown = await promise.then(
    () => undefined,
    (caught: unknown) => caught,
  );
  if (!isApiError(error)) return undefined;
  const data = error.data as { reason?: string };
  return data.reason;
}

async function createPickCampaign() {
  const { campaignIdx } = await createCampaign({
    serviceType: "PICK",
    productType: "BRAND",
    demo: false,
  });
  return campaignIdx;
}

/** 브랜드 API(A-6.3)처럼 삭제 표시만 함. 다른 슬라이스라 브랜드 API 대신 같은 목 저장소를 씀. */
function deleteBrand(brandIdx: number) {
  mockBrandDb.update((db) => {
    const brand = db.brands.find((item) => item.brandIdx === brandIdx);
    if (brand) brand.isDeleted = true;
  });
}

function draftWith(patch: (draft: CampaignDraft) => void) {
  const draft = createEmptyDraft();
  patch(draft);
  return draft;
}

describe("캠페인 생성·상세", () => {
  it("새 캠페인은 등록 중이고 유형별 접두사 코드와 빈 입력값을 갖는다", async () => {
    const campaignIdx = await createPickCampaign();

    const detail = await fetchCampaignDetail(campaignIdx);

    expect(detail.stage).toBe("DRAFT");
    expect(detail.campaignCode).toMatch(/^PB-\d{14}$/);
    expect(detail.isDemo).toBe(false);
    expect(detail.draft).toEqual(createEmptyDraft());
  });

  it("데모로 만들면 데모 표시가 붙는다", async () => {
    const { campaignIdx } = await createCampaign({
      serviceType: "PICK",
      productType: "BRAND",
      demo: true,
    });

    const detail = await fetchCampaignDetail(campaignIdx);

    expect(detail.isDemo).toBe(true);
    expect(detail.isDemoCompleted).toBe(false);
  });

  it("없는 캠페인은 404 CAMPAIGN_NOT_FOUND다", async () => {
    expect(await readReason(fetchCampaignDetail(9999))).toBe(
      "CAMPAIGN_NOT_FOUND",
    );
  });
});

describe("단계별 수정", () => {
  it("1단계를 저장하면 종료일은 시작일 + 30일이고 브랜드명을 이어 붙인다", async () => {
    const campaignIdx = await createPickCampaign();

    await saveCampaignStep(
      campaignIdx,
      "info",
      draftWith((draft) => {
        draft.info = {
          name: " 봄 체험단 ",
          brandIdx: 2,
          campaignType: "PRODUCT_DELIVERY",
          startDate: "2026-12-01",
        };
      }),
    );

    const detail = await fetchCampaignDetail(campaignIdx);
    expect(detail.draft.info.name).toBe("봄 체험단");
    expect(detail.endDate).toBe("2026-12-31");
    expect(detail.brand?.name).toBe("초록숲");
  });

  it("지운 브랜드로 1단계를 저장하면 400 INVALID_BRAND다", async () => {
    const campaignIdx = await createPickCampaign();
    deleteBrand(1);

    const reason = await readReason(
      saveCampaignStep(
        campaignIdx,
        "info",
        draftWith((draft) => {
          draft.info.brandIdx = 1;
        }),
      ),
    );

    expect(reason).toBe("INVALID_BRAND");
  });

  it("유형을 바꾸면 2~6단계를 비우고 1단계는 남긴다. 처음 고를 때는 비우지 않는다", async () => {
    const campaignIdx = await createPickCampaign();
    const draft = draftWith((value) => {
      value.info = {
        name: "캠페인",
        brandIdx: 2,
        campaignType: "PRODUCT_DELIVERY",
        startDate: null,
      };
      value.product.productName = "앰플";
      value.addOns = ["POSTING_GUIDE"];
    });
    await saveCampaignStep(campaignIdx, "product", draft);
    await saveCampaignStep(campaignIdx, "addOns", draft);
    await saveCampaignStep(campaignIdx, "info", draft);

    const kept = await fetchCampaignDetail(campaignIdx);
    expect(kept.draft.product.productName).toBe("앰플");

    draft.info.campaignType = "PRESS";
    await saveCampaignStep(campaignIdx, "info", draft);

    const cleared = await fetchCampaignDetail(campaignIdx);
    expect(cleared.draft.info.name).toBe("캠페인");
    expect(cleared.draft.product.productName).toBe("");
    expect(cleared.draft.addOns).toEqual([]);
  });

  it("2단계는 유형에 맞는 칸만 저장하고, 회수 칸이 있으면 반품 회수 있음으로 읽힌다", async () => {
    const campaignIdx = await createPickCampaign();
    const draft = draftWith((value) => {
      value.info.campaignType = "PRODUCT_DELIVERY";
      value.product.productName = "앰플";
      value.product.storeName = "다른 유형 칸";
      value.product.returnRequired = true;
      value.product.returnContact = "010-0000-0000";
    });

    await saveCampaignStep(campaignIdx, "product", draft);

    const detail = await fetchCampaignDetail(campaignIdx);
    expect(detail.draft.product.storeName).toBe("");
    expect(detail.draft.product.returnRequired).toBe(true);
    expect(detail.draft.product.rental).toBe(false);
  });

  it("3단계는 연령대·주제가 비면 400 INVALID_FIELD다", async () => {
    const campaignIdx = await createPickCampaign();

    const reason = await readReason(
      saveCampaignStep(
        campaignIdx,
        "influencer",
        draftWith((draft) => {
          draft.influencer.platform = "INSTAGRAM";
        }),
      ),
    );

    expect(reason).toBe("INVALID_FIELD");
  });

  it("올린 파일 번호로 소개서를 저장하면 그 파일 주소·종류로 읽히고, 모르는 번호는 거절한다", async () => {
    URL.createObjectURL = vi.fn(() => "blob:video");
    const campaignIdx = await createPickCampaign();
    const video = registerMockFile(new Blob(["v"], { type: "video/mp4" }));

    await saveCampaignStep(
      campaignIdx,
      "intro",
      draftWith((draft) => {
        draft.intro.detailMedia = [video];
      }),
    );

    const detail = await fetchCampaignDetail(campaignIdx);
    expect(detail.draft.intro.detailMedia).toEqual([
      {
        attachmentIdx: video.attachmentIdx,
        url: "blob:video",
        mediaType: "VIDEO",
      },
    ]);
    const reason = await readReason(
      saveCampaignStep(
        campaignIdx,
        "intro",
        draftWith((draft) => {
          draft.intro.mainImage = {
            attachmentIdx: -1,
            url: "",
            mediaType: "IMAGE",
          };
        }),
      ),
    );
    expect(reason).toBe("INVALID_ATTACHMENT");
  });

  it("승인 검토중·작성 완료 데모는 409 NOT_EDITABLE이다", async () => {
    const draft = createEmptyDraft();

    expect(
      await readReason(saveCampaignStep(PICK_REVIEWING_IDX, "product", draft)),
    ).toBe("NOT_EDITABLE");
    expect(
      await readReason(saveCampaignStep(DEMO_COMPLETED_IDX, "product", draft)),
    ).toBe("NOT_EDITABLE");
  });

  it("반려 중에는 유형·부가서비스·인원·리워드·정책 동의를 바꿀 수 없고, 같은 값은 저장된다", async () => {
    const { draft } = await fetchCampaignDetail(REJECTED_IDX);

    await saveCampaignStep(REJECTED_IDX, "addOns", draft);
    await saveCampaignStep(REJECTED_IDX, "conditions", {
      ...draft,
      conditions: { ...draft.conditions, postingPeriodMonths: 6 },
    });

    const locked = [
      saveCampaignStep(REJECTED_IDX, "info", {
        ...draft,
        info: { ...draft.info, campaignType: "PRESS" },
      }),
      saveCampaignStep(REJECTED_IDX, "addOns", { ...draft, addOns: [] }),
      saveCampaignStep(REJECTED_IDX, "conditions", {
        ...draft,
        conditions: { ...draft.conditions, headcount: 99 },
      }),
      saveCampaignStep(REJECTED_IDX, "policy", draft),
    ];
    for (const request of locked) {
      expect(await readReason(request)).toBe("LOCKED_FIELD");
    }
  });
});

describe("이전 캠페인 불러오기", () => {
  it("1~6단계를 복사하고 코드·상태는 유지하며 정책 동의는 복사하지 않는다", async () => {
    const campaignIdx = await createPickCampaign();
    const before = await fetchCampaignDetail(campaignIdx);
    const source = await fetchCampaignDetail(PICK_REVIEWING_IDX);

    await copyCampaign(campaignIdx, PICK_REVIEWING_IDX);

    const copied = await fetchCampaignDetail(campaignIdx);
    expect(copied.campaignCode).toBe(before.campaignCode);
    expect(copied.stage).toBe("DRAFT");
    expect(copied.payment).toBeNull();
    expect(copied.draft.product).toEqual(source.draft.product);
    expect(copied.draft.influencer).toEqual(source.draft.influencer);
    expect(copied.draft.policy).toEqual(createEmptyDraft().policy);
  });

  it("원본 브랜드가 지워졌으면 브랜드를 비운다", async () => {
    const campaignIdx = await createPickCampaign();
    deleteBrand(2);

    await copyCampaign(campaignIdx, PICK_REVIEWING_IDX);

    const copied = await fetchCampaignDetail(campaignIdx);
    expect(copied.draft.info.brandIdx).toBeNull();
    expect(copied.brand).toBeNull();
  });

  it("서비스 유형이 다른 캠페인은 400 SERVICE_TYPE_MISMATCH다", async () => {
    const campaignIdx = await createPickCampaign();

    expect(
      await readReason(copyCampaign(campaignIdx, RECRUIT_REVIEWING_IDX)),
    ).toBe("SERVICE_TYPE_MISMATCH");
  });
});

describe("브랜드 삭제와 캠페인", () => {
  it("결제 전 캠페인은 브랜드가 비고, 결제한 캠페인은 지운 브랜드를 그대로 보인다", async () => {
    const campaignIdx = await createPickCampaign();
    await saveCampaignStep(
      campaignIdx,
      "info",
      draftWith((draft) => {
        draft.info.brandIdx = 2;
      }),
    );

    deleteBrand(2);

    const draftCampaign = await fetchCampaignDetail(campaignIdx);
    const paidCampaign = await fetchCampaignDetail(PICK_REVIEWING_IDX);
    expect(draftCampaign.draft.info.brandIdx).toBeNull();
    expect(draftCampaign.brand).toBeNull();
    expect(paidCampaign.brand?.name).toBe("초록숲");
  });
});
