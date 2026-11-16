import { transformCampaignList } from "./transform-campaigns";

import type { CampaignListItem } from "../model/schema";

function item(overrides: Partial<CampaignListItem> = {}): CampaignListItem {
  return {
    campaignIdx: 7,
    campaignCode: "CMP-0007",
    serviceType: "RECRUIT",
    productType: "BRAND",
    status: "DRAFT",
    name: "비글로우 신제품 런칭 캠페인",
    brandName: "비글로우",
    description: "MZ세대를 위한 비글로우 톤업크림",
    thumbnailUrl: "https://example.com/a.png",
    startDate: "2026-11-01",
    endDate: "2026-12-31",
    demo: false,
    demoCompleted: false,
    ...overrides,
  };
}

function response(
  list: CampaignListItem[],
  count = list.length,
  entrySize = 6,
) {
  return { list, count, currentPage: 1, entrySize };
}

describe("transformCampaignList", () => {
  it("서버 값을 화면 모델로 바꾼다", () => {
    const { records } = transformCampaignList(response([item()]));

    expect(records[0]).toMatchObject({
      id: "7",
      campaignIdx: 7,
      stage: "DRAFT",
      rawStatus: "DRAFT",
      type: "recruitBrand",
      startDate: "2026-11-01",
      isDemo: false,
    });
  });

  it("비어 있거나 없는 부제·썸네일·기간은 null로 둔다", () => {
    const { records } = transformCampaignList(
      response([
        item({
          description: "",
          thumbnailUrl: null,
          startDate: "",
          endDate: null,
        }),
      ]),
    );

    expect(records[0]).toMatchObject({
      description: null,
      thumbnailUrl: null,
      startDate: null,
      endDate: null,
    });
  });

  it("모르는 진행 단계·유형 코드는 null로 두고 서버 값을 남긴다", () => {
    const { records } = transformCampaignList(
      response([item({ status: "PENDING", serviceType: "LIVE" })]),
    );

    expect(records[0]).toMatchObject({
      stage: null,
      rawStatus: "PENDING",
      type: null,
      rawTypeText: "LIVE BRAND",
    });
  });

  it("전체 쪽 수는 건수를 한 쪽 개수로 나눠 올림한다", () => {
    expect(transformCampaignList(response([], 13)).totalPages).toBe(3);
    expect(transformCampaignList(response([], 12)).totalPages).toBe(2);
    expect(transformCampaignList(response([], 0)).totalPages).toBe(0);
  });

  it("한 쪽 개수가 0으로 오면 기본 6개로 계산한다", () => {
    expect(transformCampaignList(response([], 13, 0)).totalPages).toBe(3);
  });
});
