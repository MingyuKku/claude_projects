import {
  searchPreviousCampaigns,
  type CampaignServiceType,
} from "@/entities/campaign";
import { useInfinitePages } from "@/shared/lib";

/** 한 번에 읽는 건수(요구 명세 A-6 제안값). */
export const PREVIOUS_CAMPAIGN_PAGE_SIZE = 20;

interface UsePreviousCampaignsOptions {
  /** 지금 등록 중인 캠페인과 같은 서비스 유형만 보임. */
  serviceType: CampaignServiceType;
  /** 지금 등록 중인 캠페인(자기 자신은 목록에서 뺌). */
  excludeCampaignIdx: number;
  /** 실행한 검색어(캠페인명 또는 브랜드명). 비면 전체. 입력 중인 값이 아니라 "검색"을 누른 값임. */
  keyword: string;
}

/**
 * 이전 캠페인 목록. 시안에 쪽 이동이 없어 스크롤로 이어 읽음(PC·TAB·MO 모두).
 * 어떤 상태의 캠페인까지 보일지는 서버가 정함(요구 명세 A-6, 아직 미정).
 */
export function usePreviousCampaigns({
  serviceType,
  excludeCampaignIdx,
  keyword,
}: UsePreviousCampaignsOptions) {
  return useInfinitePages(
    ["campaign", "previous", serviceType, excludeCampaignIdx, keyword],
    async (page) => {
      const result = await searchPreviousCampaigns({
        serviceType,
        keyword: keyword === "" ? null : keyword,
        excludeCampaignIdx,
        page,
        entrySize: PREVIOUS_CAMPAIGN_PAGE_SIZE,
      });
      return {
        records: result.list,
        totalCount: result.count,
        totalPages: Math.ceil(result.count / result.entrySize),
      };
    },
    // 불러오기를 닫았다 열 때마다 새로 읽음(그사이 등록한 캠페인이 보이도록).
    { revalidateIfStale: true },
  );
}
