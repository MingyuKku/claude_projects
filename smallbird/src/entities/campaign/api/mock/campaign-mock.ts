import { ApiError } from "@/shared/api";
import { createMockStore } from "@/shared/lib";

import { CAMPAIGN_PAGE_SIZE, getTypeFilterCodes } from "../../model/codes";

import type {
  CampaignListItem,
  CampaignListResponse,
} from "../../model/schema";
import type { CampaignListQuery } from "../../model/types";

// 캠페인 목록·삭제(A-2·A-4)의 목 저장소. 등록 마법사가 아직 없어 시드 데이터만 있고, 삭제는 저장소에 반영됨.
interface CampaignMockDb {
  campaigns: CampaignListItem[];
}

type SeedInput = Pick<
  CampaignListItem,
  "serviceType" | "productType" | "status" | "name" | "description"
> &
  Partial<Pick<CampaignListItem, "brandName" | "demo" | "demoCompleted">>;

const SEEDS: SeedInput[] = [
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "DRAFT",
    name: "비글로우 신제품 런칭 캠페인",
    description: "MZ세대를 위한 비글로우 톤업크림",
    brandName: "비글로우",
  },
  {
    serviceType: "PICK",
    productType: "BRAND",
    status: "DRAFT",
    name: "초록숲 체험단 모집",
    description: "민감성 피부를 위한 진정 앰플",
    brandName: "초록숲",
    demo: true,
  },
  {
    serviceType: "PICK",
    productType: "BRAND",
    status: "DRAFT",
    name: "데일리 스튜디오 데모 캠페인",
    description: "작성을 마친 데모",
    brandName: "데일리 스튜디오",
    demo: true,
    demoCompleted: true,
  },
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "REJECTED",
    name: "빅링크 코스메틱 겨울 기획전",
    description: "겨울 보습 케어 라인",
    brandName: "빅링크 코스메틱",
  },
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "REVIEWING",
    name: "비글로우 선케어 캠페인",
    description: "자외선 차단 신제품",
    brandName: "비글로우",
  },
  {
    serviceType: "PICK",
    productType: "BRAND",
    status: "REVIEWING",
    name: "초록숲 비건 스킨케어",
    description: "비건 인증 스킨케어 3종",
    brandName: "초록숲",
  },
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "IN_PROGRESS",
    name: "데일리 스튜디오 가을 룩북",
    description: "가을 시즌 의류 협찬",
    brandName: "데일리 스튜디오",
  },
  {
    serviceType: "PICK",
    productType: "BRAND",
    status: "IN_PROGRESS",
    name: "빅링크 헤어 에센스 리뷰",
    description: "손상모 케어 에센스",
    brandName: "빅링크 코스메틱",
  },
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "IN_PROGRESS",
    name: "비글로우 쿠션 체험단",
    description: "커버력 높은 쿠션 팩트",
    brandName: "비글로우",
  },
  {
    serviceType: "PICK",
    productType: "BRAND",
    status: "ENDED",
    name: "초록숲 여름 쿨링 앰플",
    description: "쿨링 진정 앰플",
    brandName: "초록숲",
  },
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "ENDED",
    name: "데일리 스튜디오 봄 신상",
    description: "봄 신상 의류",
    brandName: "데일리 스튜디오",
  },
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "ENDED",
    name: "빅링크 립 틴트 캠페인",
    description: "롱 래스팅 립 틴트",
    brandName: "빅링크 코스메틱",
  },
  {
    serviceType: "PICK",
    productType: "BRAND",
    status: "ENDED",
    name: "비글로우 샴푸 리뷰",
    description: "두피 케어 샴푸",
    brandName: "비글로우",
  },
  {
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "DRAFT",
    name: "초록숲 선물 세트 기획",
    description: "명절 선물 세트",
    brandName: "초록숲",
  },
];

const BEFORE_APPROVAL = ["DRAFT", "REVIEWING", "REJECTED"];

function toItem(seed: SeedInput, index: number): CampaignListItem {
  const campaignIdx = index + 1;
  const isBeforeApproval = BEFORE_APPROVAL.includes(seed.status);
  const month = 1 + (index % 9);
  return {
    campaignIdx,
    campaignCode: `CMP-${String(campaignIdx).padStart(4, "0")}`,
    serviceType: seed.serviceType,
    productType: seed.productType,
    status: seed.status,
    name: seed.name,
    brandName: seed.brandName ?? null,
    description: seed.description,
    thumbnailUrl: null,
    // 승인 전은 희망 일정이라 일부는 비워 "-"를 확인할 수 있게 함.
    startDate:
      isBeforeApproval && index % 4 === 0
        ? null
        : `2026-${String(month).padStart(2, "0")}-01`,
    endDate:
      isBeforeApproval && index % 4 === 0
        ? null
        : `2026-${String(month + 2).padStart(2, "0")}-28`,
    demo: seed.demo ?? false,
    demoCompleted: seed.demoCompleted ?? false,
  };
}

const campaignMockDb = createMockStore<CampaignMockDb>(
  "bigbird:mock:campaigns",
  () => ({ campaigns: SEEDS.map(toItem) }),
);

/** 서버처럼 상태·유형·검색(캠페인명·브랜드명)을 걸러 최초 등록일(여기서는 번호) 최신순으로 한 쪽을 줌(A-2). */
export async function listCampaigns(
  query: CampaignListQuery,
): Promise<CampaignListResponse> {
  const keyword = query.keyword.trim().toLowerCase();
  const codes = query.type ? getTypeFilterCodes(query.type) : null;
  const matched = campaignMockDb
    .get()
    .campaigns.filter(
      (item) =>
        (query.statuses.length === 0 ||
          query.statuses.some((status) => status === item.status)) &&
        (!codes ||
          (item.serviceType === codes.serviceType &&
            item.productType === codes.productType)) &&
        (!keyword ||
          item.name.toLowerCase().includes(keyword) ||
          (item.brandName ?? "").toLowerCase().includes(keyword)),
    )
    .sort((a, b) => b.campaignIdx - a.campaignIdx);
  const start = (query.page - 1) * CAMPAIGN_PAGE_SIZE;
  return {
    list: matched.slice(start, start + CAMPAIGN_PAGE_SIZE),
    count: matched.length,
    currentPage: query.page,
    entrySize: CAMPAIGN_PAGE_SIZE,
  };
}

/** 등록 중(`DRAFT`)만 지움. 아니면 409 `NOT_DELETABLE`(A-4). */
export async function deleteCampaign(campaignIdx: number): Promise<void> {
  const target = campaignMockDb
    .get()
    .campaigns.find((item) => item.campaignIdx === campaignIdx);
  if (!target) throw new ApiError(404, { code: "NOT_FOUND" });
  if (target.status !== "DRAFT") {
    throw new ApiError(409, { code: "NOT_DELETABLE" });
  }
  campaignMockDb.update((db) => {
    db.campaigns = db.campaigns.filter(
      (item) => item.campaignIdx !== campaignIdx,
    );
  });
}
