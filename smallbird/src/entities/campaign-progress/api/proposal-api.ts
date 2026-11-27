import { serverApiV3 } from "@/shared/api";

import { transformProposalList } from "../lib/transform-proposals";
import { proposalListSchema } from "../model/proposal-schema";

import type { CampaignProposalList, ProposalStatus } from "../model/proposal";

export interface ProposalListQuery {
  campaignIdx: number;
  status: ProposalStatus | null;
  keyword: string;
}

/** 캠페인 하나의 매칭 제안 목록. 검색어는 핸들·닉네임 부분 일치(서버). */
export async function fetchCampaignProposals({
  campaignIdx,
  status,
  keyword,
}: ProposalListQuery): Promise<CampaignProposalList> {
  return transformProposalList(
    proposalListSchema.parse(
      await serverApiV3.get("/matching/influencer/proposal", {
        params: {
          campaignIdx,
          ...(status && { status }),
          ...(keyword && { keyword }),
        },
      }),
    ),
  );
}
