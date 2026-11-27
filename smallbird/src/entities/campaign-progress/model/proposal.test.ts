import { getDisplayStatus } from "./proposal";

import type { CampaignProposal } from "./proposal";

function proposal(
  status: CampaignProposal["status"],
  awaitingResponseFrom: CampaignProposal["awaitingResponseFrom"],
): CampaignProposal {
  return {
    proposalIdx: 1,
    platformIdx: 1,
    handle: "haru",
    nickname: null,
    profileImageUrl: null,
    status,
    rawStatus: status ?? "UNKNOWN",
    awaitingResponseFrom,
    amount: 1000,
    responseDeadline: null,
    lastMessageAt: null,
  };
}

describe("getDisplayStatus", () => {
  it("광고주가 다시 제안해 크리에이터 응답을 기다리는 재협상은 제안 중", () => {
    expect(getDisplayStatus(proposal("NEGOTIATING", "INFLUENCER"))).toBe(
      "PROPOSED",
    );
  });

  it("크리에이터가 요청해 광고주 차례인 재협상은 재협상 요청 그대로", () => {
    expect(getDisplayStatus(proposal("NEGOTIATING", "ADVERTISER"))).toBe(
      "NEGOTIATING",
    );
  });

  it("차례 값이 없는 재협상은 서버 상태 그대로", () => {
    expect(getDisplayStatus(proposal("NEGOTIATING", null))).toBe("NEGOTIATING");
  });

  it("다른 상태는 차례 값과 상관없이 그대로", () => {
    expect(getDisplayStatus(proposal("ACCEPTED", "INFLUENCER"))).toBe(
      "ACCEPTED",
    );
    expect(getDisplayStatus(proposal(null, null))).toBeNull();
  });
});
