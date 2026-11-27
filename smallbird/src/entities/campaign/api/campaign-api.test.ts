import { serverApiV3 } from "@/shared/api";

import {
  deleteCampaign,
  fetchCampaigns,
  fetchCopySources,
} from "./campaign-api";

import type * as SharedApi from "@/shared/api";

// 목록 조회·삭제 요청을 서버로 보내는지 검증함.
vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn(), delete: vi.fn() },
}));

const mockGet = vi.mocked(serverApiV3.get);
const mockDelete = vi.mocked(serverApiV3.delete);

function item(campaignIdx: number, overrides: Record<string, unknown> = {}) {
  return {
    campaignIdx,
    campaignCode: `PB-${campaignIdx}`,
    serviceType: "PICK",
    productType: "BRAND",
    status: "DRAFT",
    name: `캠페인 ${campaignIdx}`,
    productName: "톤업크림",
    createdDate: "2026-11-16 10:00:00",
    ...overrides,
  };
}

function listResponse(items: unknown[]) {
  return { list: items, count: items.length, currentPage: 1, entrySize: 6 };
}

beforeEach(() => {
  window.sessionStorage.clear();
  vi.resetAllMocks();
});

describe("목록", () => {
  it("현황 조건을 쿼리로 보내고 부제를 제품명으로 읽는다", async () => {
    mockGet.mockResolvedValue(
      listResponse([item(7, { name: null, serviceType: null })]),
    );

    const page = await fetchCampaigns({
      statuses: ["REVIEWING", "REJECTED"],
      type: "pickBrand",
      keyword: "톤업",
      page: 2,
    });

    expect(mockGet).toHaveBeenCalledWith("/campaign", {
      params: {
        status: "REVIEWING,REJECTED",
        serviceType: "PICK",
        productType: "BRAND",
        keyword: "톤업",
        page: 2,
        entrySize: 15,
      },
    });
    expect(page.records[0]).toMatchObject({
      name: "",
      productName: "톤업크림",
      type: null,
    });
  });

  it("이전 캠페인 불러오기는 상태를 보내지 않고 지금 캠페인을 뺀다", async () => {
    mockGet.mockResolvedValue(listResponse([item(5)]));

    await fetchCopySources(
      {
        serviceType: "PICK",
        productType: "BRAND",
        excludeCampaignIdx: 7,
        keyword: "",
      },
      1,
    );

    expect(mockGet).toHaveBeenCalledWith("/campaign", {
      params: {
        serviceType: "PICK",
        productType: "BRAND",
        excludeCampaignIdx: 7,
        page: 1,
        entrySize: 20,
      },
    });
  });

  it("삭제는 서버의 삭제 API로 보낸다", async () => {
    mockDelete.mockResolvedValue(undefined);

    await deleteCampaign(7);

    expect(mockDelete).toHaveBeenCalledExactlyOnceWith("/campaign/7");
  });
});
