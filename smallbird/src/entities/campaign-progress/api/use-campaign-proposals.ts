import useSWR from "swr";

import { fetchCampaignProposals } from "./proposal-api";

import type { ProposalListQuery } from "./proposal-api";

export function campaignProposalsKey(query: ProposalListQuery) {
  return [
    "campaign-progress",
    "proposals",
    query.campaignIdx,
    query.status,
    query.keyword,
  ] as const;
}

/** 매칭 목록. 상단 집계는 필터와 무관하게 같은 응답에 옴. */
export function useCampaignProposals(query: ProposalListQuery) {
  const { data, error, isLoading, mutate } = useSWR(
    campaignProposalsKey(query),
    ([, , campaignIdx, status, keyword]) =>
      fetchCampaignProposals({ campaignIdx, status, keyword }),
    { keepPreviousData: true },
  );
  return { list: data, error, isLoading, mutate };
}
