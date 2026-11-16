import { createEmptyRecord, toDateTime, toEndDate } from "./campaign-record";

import type { MockCampaignRecord } from "./campaign-record";

// 캠페인 목 저장소의 처음 데이터(현황 목록·불러오기·등록 내역 확인용).

type SeedInput = Pick<
  MockCampaignRecord,
  "serviceType" | "productType" | "status"
> & {
  name: string;
  description: string;
  brandIdx: number;
  demo?: boolean;
  demoCompleted?: boolean;
};

// 브랜드 번호는 브랜드 목 저장소 시드(4 비글로우 · 3 빅링크 코스메틱 · 2 초록숲 · 1 데일리 스튜디오).
export const SEEDS: SeedInput[] = [
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "DRAFT",
    name: "비글로우 신제품 런칭 캠페인",
    description: "MZ세대를 위한 비글로우 톤업크림",
    brandIdx: 4,
  },
  {
    serviceType: "PICK",
    productType: "BRAND",
    status: "DRAFT",
    name: "초록숲 체험단 모집",
    description: "민감성 피부를 위한 진정 앰플",
    brandIdx: 2,
    demo: true,
  },
  {
    serviceType: "PICK",
    productType: "BRAND",
    status: "DRAFT",
    name: "데일리 스튜디오 데모 캠페인",
    description: "작성을 마친 데모",
    brandIdx: 1,
    demo: true,
    demoCompleted: true,
  },
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "REJECTED",
    name: "빅링크 코스메틱 겨울 기획전",
    description: "겨울 보습 케어 라인",
    brandIdx: 3,
  },
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "REVIEWING",
    name: "비글로우 선케어 캠페인",
    description: "자외선 차단 신제품",
    brandIdx: 4,
  },
  {
    serviceType: "PICK",
    productType: "BRAND",
    status: "REVIEWING",
    name: "초록숲 비건 스킨케어",
    description: "비건 인증 스킨케어 3종",
    brandIdx: 2,
  },
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "IN_PROGRESS",
    name: "데일리 스튜디오 가을 룩북",
    description: "가을 시즌 의류 협찬",
    brandIdx: 1,
  },
  {
    serviceType: "PICK",
    productType: "BRAND",
    status: "IN_PROGRESS",
    name: "빅링크 헤어 에센스 리뷰",
    description: "손상모 케어 에센스",
    brandIdx: 3,
  },
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "IN_PROGRESS",
    name: "비글로우 쿠션 체험단",
    description: "커버력 높은 쿠션 팩트",
    brandIdx: 4,
  },
  {
    serviceType: "PICK",
    productType: "BRAND",
    status: "ENDED",
    name: "초록숲 여름 쿨링 앰플",
    description: "쿨링 진정 앰플",
    brandIdx: 2,
  },
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "ENDED",
    name: "데일리 스튜디오 봄 신상",
    description: "봄 신상 의류",
    brandIdx: 1,
  },
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "ENDED",
    name: "빅링크 립 틴트 캠페인",
    description: "롱 래스팅 립 틴트",
    brandIdx: 3,
  },
  {
    serviceType: "PICK",
    productType: "BRAND",
    status: "ENDED",
    name: "비글로우 샴푸 리뷰",
    description: "두피 케어 샴푸",
    brandIdx: 4,
  },
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "DRAFT",
    name: "초록숲 선물 세트 기획",
    description: "명절 선물 세트",
    brandIdx: 2,
  },
];

const BEFORE_APPROVAL = ["DRAFT", "REVIEWING", "REJECTED"];
const PAID_STATUSES = ["REVIEWING", "REJECTED", "IN_PROGRESS", "ENDED"];
const SEED_REJECT_REASON =
  "협찬 제품 금액이 실제 판매 금액과 일치하는지 확인해주세요.";

/** 결제를 마친 캠페인과 작성을 마친 데모는 모든 단계를 채워 둠(불러오기·등록 내역 확인용). */
function fillInputs(record: MockCampaignRecord, seed: SeedInput) {
  const isRecruit = seed.serviceType === "RECRUIT";
  record.info.campaignType = "PRODUCT_DELIVERY";
  record.product.productName = `${seed.name} 협찬 제품`;
  record.product.quantityPerInfluencer = 1;
  record.product.productPrice = 45000;
  record.influencer = {
    platform: "INSTAGRAM",
    gender: "FEMALE",
    ageGroups: ["AGE_20S", "AGE_30S"],
    topics: ["Beauty"],
  };
  record.addOns = ["AI_POSTING_GUIDE"];
  record.intro.notice = "제품 수령 후 7일 안에 게시해 주세요.";
  record.intro.contentHashtags = ["협찬", "체험단"];
  record.conditions = {
    headcount: isRecruit ? 20 : null,
    rewardPerInfluencer: isRecruit ? 5000 : null,
    postingPeriodMonths: 3,
    secondaryCopyright: false,
  };
  record.policy = {
    agreements: { service: true, privacy: true, operation: true, reward: true },
  };
}

export function toSeedRecord(
  seed: SeedInput,
  index: number,
): MockCampaignRecord {
  const campaignIdx = index + 1;
  const created = new Date(2026, 9, 1 + index, 10, 0, 0);
  const record = createEmptyRecord({
    campaignIdx,
    serviceType: seed.serviceType,
    productType: seed.productType,
    demo: seed.demo ?? false,
    createdDate: toDateTime(created),
  });
  record.status = seed.status;
  record.demoCompleted = seed.demoCompleted ?? false;
  record.info.name = seed.name;
  record.info.brandIdx = seed.brandIdx;
  record.intro.description = seed.description;
  // 승인 전은 희망 일정이라 일부는 비워 "-"를 확인할 수 있게 함.
  const month = 1 + (index % 9);
  const hasDates = !(BEFORE_APPROVAL.includes(seed.status) && index % 4 === 0);
  record.info.startDate = hasDates
    ? `2026-${String(month).padStart(2, "0")}-01`
    : null;
  record.info.endDate = toEndDate(record.info.startDate);

  const isPaid = PAID_STATUSES.includes(seed.status);
  if (isPaid || record.demoCompleted) fillInputs(record, seed);
  if (isPaid) {
    record.payment = { paidAmount: 10000, paidAt: toDateTime(created) };
  }
  if (seed.status === "REJECTED") record.rejectReason = SEED_REJECT_REASON;
  return record;
}
