import { isApiError } from "@/shared/api";

import { deleteCampaign, fetchCampaigns } from "./campaign-api";

import type { CampaignListQuery } from "../model/types";

const ALL: CampaignListQuery = {
  statuses: [],
  type: null,
  keyword: "",
  page: 1,
};

beforeEach(() => window.sessionStorage.clear());

describe("fetchCampaigns", () => {
  it("한 쪽 6개를 최신순으로 주고 전체 건수와 쪽 수를 계산한다", async () => {
    const first = await fetchCampaigns(ALL);

    expect(first.records).toHaveLength(6);
    expect(first.totalCount).toBe(14);
    expect(first.totalPages).toBe(3);
    const ids = first.records.map((record) => record.campaignIdx);
    expect(ids).toEqual([...ids].sort((a, b) => b - a));
  });

  it("진행 단계·유형·검색어를 함께 건다", async () => {
    const draft = await fetchCampaigns({ ...ALL, statuses: ["DRAFT"] });
    expect(draft.records.every((record) => record.stage === "DRAFT")).toBe(
      true,
    );

    const pick = await fetchCampaigns({ ...ALL, type: "pickBrand" });
    expect(pick.records.every((record) => record.type === "pickBrand")).toBe(
      true,
    );

    const keyword = await fetchCampaigns({ ...ALL, keyword: "초록숲" });
    expect(keyword.totalCount).toBeGreaterThan(0);
    expect(keyword.totalCount).toBeLessThan(14);
  });
});

describe("deleteCampaign", () => {
  it("등록 중 캠페인을 지우면 목록에서 빠진다", async () => {
    const [draft] = (await fetchCampaigns({ ...ALL, statuses: ["DRAFT"] }))
      .records;
    if (!draft) throw new Error("seed draft campaign is missing");

    await deleteCampaign(draft.campaignIdx);

    const after = await fetchCampaigns(ALL);
    expect(after.totalCount).toBe(13);
  });

  it("등록 중이 아니면 409로 거절한다", async () => {
    const [ended] = (await fetchCampaigns({ ...ALL, statuses: ["ENDED"] }))
      .records;
    if (!ended) throw new Error("seed ended campaign is missing");

    const error = await deleteCampaign(ended.campaignIdx).catch(
      (thrown: unknown) => thrown,
    );

    expect(isApiError(error) && error.status).toBe(409);
  });
});
