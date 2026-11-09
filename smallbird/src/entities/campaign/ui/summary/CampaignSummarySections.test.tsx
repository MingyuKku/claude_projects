import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  createCampaignDraft,
  fetchCampaign,
  payCampaign,
  saveCampaignDraft,
  testReviewCampaign,
} from "../../api/campaign-api";
import { CAMPAIGN_TOPICS } from "../../model/codes";
import { CampaignSummarySections } from "./CampaignSummarySections";

import type { CampaignServiceType, CampaignType } from "../../model/codes";
import type { CampaignDraft } from "../../model/schema";

beforeEach(() => window.sessionStorage.clear());

const file = (fileId: string) => ({
  fileId,
  url: `blob:${fileId}`,
  mediaType: "IMAGE" as const,
  durationSec: null,
  thumbnailUrl: null,
});

// 유형별 입력을 채운 캠페인을 서버(목)에 저장하고 등록 내역으로 읽어 옴.
async function loadCampaign(options: {
  serviceType: CampaignServiceType;
  type: CampaignType;
  product?: Partial<CampaignDraft["product"]>;
  addOns?: CampaignDraft["addOns"];
  conditions?: Partial<CampaignDraft["conditions"]>;
  pay?: boolean;
}) {
  const draft = await createCampaignDraft({
    serviceType: options.serviceType,
    productType: "BRAND",
  });
  const saved = await saveCampaignDraft({
    ...draft,
    campaignInfo: {
      name: "봄 캠페인",
      campaignType: options.type,
      brandIdx: 1,
      startDate: "2030-01-01",
      endDate: null,
    },
    product: { ...draft.product, ...options.product },
    influencer: {
      platform: "INSTAGRAM",
      gender: "ALL",
      ageGroups: ["AGE_20S", "AGE_30S"],
      topics: [CAMPAIGN_TOPICS[0], CAMPAIGN_TOPICS[1]],
    },
    addOns: options.addOns ?? [],
    intro: {
      mode: "AI",
      sourceUrl: null,
      mainImage: file("main"),
      media: [file("m1")],
      description: "캠페인 설명입니다.",
      notice: "유의사항입니다.",
      hashtags: ["여름", "세일"],
      aiJob: null,
    },
    conditions: { ...draft.conditions, ...options.conditions },
    policy: {
      agreements: {
        service: true,
        privacy: true,
        operation: true,
        reward: true,
      },
    },
  });
  expect(saved.version).toBeGreaterThan(draft.version);
  if (options.pay) await payCampaign(draft.campaignIdx, 10_000);
  return fetchCampaign(draft.campaignIdx);
}

// 반려된 섹션은 제목 앞에 "수정 필요" 배지가 붙으므로 이름 끝이 같은 제목을 찾음.
const section = (name: string) =>
  within(
    screen
      .getByRole("heading", { name: new RegExp(`${name}$`) })
      .closest("section")!,
  );

describe("등록 내역 섹션 카드", () => {
  it("섹션 8개가 번호 순서대로 나온다", async () => {
    const campaign = await loadCampaign({
      serviceType: "PICK",
      type: "PRESS",
      conditions: { postingPeriodMonths: 6, secondaryCopyright: true },
    });
    render(<CampaignSummarySections campaign={campaign} />);

    const titles = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual([
      "1캠페인 정보",
      "2제품 정보",
      "3인플루언서 조건",
      "4부가서비스",
      "5캠페인 소개서",
      "6진행 조건",
      "7정책 동의",
      "8결제 정보",
    ]);
  });

  it("PICK형 제품발송형은 협찬 제품·회수 배지·부가서비스·진행 조건을 보인다", async () => {
    const campaign = await loadCampaign({
      serviceType: "PICK",
      type: "PRODUCT_DELIVERY",
      product: {
        productName: "봄 신상 크림",
        quantityPerInfluencer: 2,
        productPrice: 10_000,
        returnRequired: false,
      },
      addOns: ["AI_POSTING_GUIDE"],
      conditions: { postingPeriodMonths: 6, secondaryCopyright: true },
    });
    render(<CampaignSummarySections campaign={campaign} />);

    expect(section("제품 정보").getByText("제품발송형")).toBeVisible();
    expect(section("제품 정보").getByText("10,000원")).toBeVisible();
    expect(section("제품 정보").getByText("봄 신상 크림 (2개)")).toBeVisible();
    expect(section("제품 정보").getByText("회수 안함")).toBeVisible();
    expect(section("인플루언서 조건").getByText("20대, 30대")).toBeVisible();
    expect(section("부가서비스").getByText("신청함")).toBeVisible();
    expect(
      section("캠페인 소개서").getByText("AI 생성 가이드 사용"),
    ).toBeVisible();
    expect(section("캠페인 소개서").getByText("여름")).toBeVisible();
    expect(section("진행 조건").getByText("6개월 이상")).toBeVisible();
    expect(
      section("진행 조건").getByText("사용함 (상업적 사용 포함)"),
    ).toBeVisible();
    expect(
      section("진행 조건").queryByText("진행 인원"),
    ).not.toBeInTheDocument();
    expect(section("정책 동의").getByText("전체 동의 완료")).toBeVisible();
  });

  it("매장방문형은 쿠폰·매장·주소·혜택을 보인다", async () => {
    const campaign = await loadCampaign({
      serviceType: "PICK",
      type: "STORE_VISIT",
      product: {
        visitCouponCode: "123456789",
        storeName: "한솥",
        storeAddress: {
          zonecode: "06232",
          address: "강남구 강남대로 312",
          detail: "3045호",
        },
        visitBenefit: "도시락 1개 무료",
      },
      conditions: { postingPeriodMonths: 3, secondaryCopyright: false },
    });
    render(<CampaignSummarySections campaign={campaign} />);

    const product = section("제품 정보");
    expect(product.getByText("123456789")).toBeVisible();
    expect(product.getByText("한솥")).toBeVisible();
    expect(product.getByText("강남구 강남대로 312 3045호")).toBeVisible();
    expect(product.getByText("도시락 1개 무료")).toBeVisible();
    expect(section("진행 조건").getByText("사용 안 함")).toBeVisible();
  });

  it("모집형 구매리뷰형은 구매제품 금액·모집 인원·리워드를 보이고 유지기간은 없다", async () => {
    const campaign = await loadCampaign({
      serviceType: "RECRUIT",
      type: "PURCHASE_REVIEW",
      product: {
        productName: "구매 제품",
        purchaseUrl: "https://shop.test/p/1",
        purchasePrice: 15_000,
        purchaseGuide: "구매 후 후기를 남겨 주세요.",
      },
      addOns: ["AI_MANUSCRIPT_CONFIRM"],
      conditions: { headcount: 10, rewardPerInfluencer: 5_000 },
    });
    render(<CampaignSummarySections campaign={campaign} />);

    expect(section("제품 정보").getByText("15,000원")).toBeVisible();
    expect(
      section("제품 정보").getByText("구매 후 후기를 남겨 주세요."),
    ).toBeVisible();
    const conditions = section("진행 조건");
    expect(conditions.getByText("모집 인원")).toBeVisible();
    expect(conditions.getByText("10명")).toBeVisible();
    expect(conditions.getByText("5,000원 (1인당)")).toBeVisible();
    expect(conditions.queryByText("콘텐츠 유지 기간")).not.toBeInTheDocument();
  });

  it("PICK형 구매리뷰형은 진행 조건 대신 안내만 있고 결제 전에는 결제 정보가 비어 있다", async () => {
    const campaign = await loadCampaign({
      serviceType: "PICK",
      type: "PURCHASE_REVIEW",
      product: {
        productName: "구매 제품",
        purchaseUrl: "https://shop.test/p/1",
      },
    });
    render(<CampaignSummarySections campaign={campaign} />);

    expect(section("진행 조건").getByText("설정한 진행 조건")).toBeVisible();
    expect(section("결제 정보").getAllByText("-")).toHaveLength(3);
  });

  it("결제한 캠페인은 결제 금액·수단·일시(날짜만)를 보인다", async () => {
    const campaign = await loadCampaign({
      serviceType: "PICK",
      type: "PRESS",
      addOns: ["AI_POSTING_GUIDE"],
      conditions: { postingPeriodMonths: 3, secondaryCopyright: true },
      pay: true,
    });
    render(<CampaignSummarySections campaign={campaign} />);

    const payment = section("결제 정보");
    expect(payment.getByText("10,000원")).toBeVisible();
    expect(payment.getByText("빅버드 머니 결제")).toBeVisible();
    expect(payment.getByText(/^\d{4}\.\d{2}\.\d{2}$/)).toBeVisible();
  });

  it("반려된 섹션에만 수정 필요 배지와 사유가 붙고 다른 상태에서는 보이지 않는다", async () => {
    const reviewing = await loadCampaign({
      serviceType: "PICK",
      type: "PRESS",
      addOns: ["AI_POSTING_GUIDE"],
      conditions: { postingPeriodMonths: 3, secondaryCopyright: true },
      pay: true,
    });
    await testReviewCampaign(reviewing.campaignIdx, {
      result: "REJECT",
      rejections: [{ section: "PRODUCT", reason: "금액을 확인해주세요." }],
    });
    const rejected = await fetchCampaign(reviewing.campaignIdx);
    render(<CampaignSummarySections campaign={rejected} />);

    expect(section("제품 정보").getByText("수정 필요")).toBeVisible();
    expect(
      section("제품 정보").getByText("금액을 확인해주세요."),
    ).toBeVisible();
    expect(
      section("제품 정보").getByText("수정 필요").closest("section"),
    ).toHaveClass("border-foreground/60");
    expect(
      section("캠페인 정보").queryByText("수정 필요"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("수정 필요")).toHaveLength(1);
  });

  it("반려 기록이 있어도 반려 상태가 아니면 사유를 보이지 않는다", async () => {
    const campaign = await loadCampaign({
      serviceType: "PICK",
      type: "PRESS",
      addOns: ["AI_POSTING_GUIDE"],
      conditions: { postingPeriodMonths: 3, secondaryCopyright: true },
      pay: true,
    });
    render(
      <CampaignSummarySections
        campaign={{
          ...campaign,
          status: "RE_REVIEWING",
          rejections: [{ section: "PRODUCT", reason: "금액을 확인해주세요." }],
        }}
      />,
    );

    expect(screen.queryByText("수정 필요")).not.toBeInTheDocument();
    expect(screen.queryByText("금액을 확인해주세요.")).not.toBeInTheDocument();
  });

  it("수정할 섹션으로 넘긴 곳에만 수정 버튼이 있고 누르면 그 섹션 코드를 알린다", async () => {
    const campaign = await loadCampaign({
      serviceType: "PICK",
      type: "PRESS",
      conditions: { postingPeriodMonths: 3, secondaryCopyright: true },
    });
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(
      <CampaignSummarySections
        campaign={campaign}
        editableSections={["PRODUCT", "INTRO"]}
        onEdit={onEdit}
      />,
    );

    expect(screen.getAllByRole("button", { name: "수정" })).toHaveLength(2);
    expect(section("부가서비스").queryByRole("button")).not.toBeInTheDocument();

    await user.click(
      section("제품 정보").getByRole("button", { name: "수정" }),
    );
    expect(onEdit).toHaveBeenCalledWith("PRODUCT");
  });

  it("수정할 섹션을 넘기지 않으면 수정 버튼이 없다", async () => {
    const campaign = await loadCampaign({
      serviceType: "PICK",
      type: "PRESS",
      conditions: { postingPeriodMonths: 3, secondaryCopyright: true },
    });
    render(<CampaignSummarySections campaign={campaign} />);

    expect(
      screen.queryByRole("button", { name: "수정" }),
    ).not.toBeInTheDocument();
  });
});
