import {
  getDetailRedirectPath,
  getRegisterRedirectPath,
  parseRegisterEntry,
} from "./entry";

import type { CampaignDetail } from "@/entities/campaign";

describe("parseRegisterEntry", () => {
  it.each([
    ["type=pick", { kind: "create", isDemo: false, productType: "BRAND" }],
    [
      "type=pick&demo=true",
      { kind: "create", isDemo: true, productType: "BRAND" },
    ],
    [
      "type=pick&demo=1",
      { kind: "create", isDemo: false, productType: "BRAND" },
    ],
    [
      "type=pick&product=group-buy",
      { kind: "create", isDemo: false, productType: "GROUP_BUY" },
    ],
    [
      "type=pick&product=group-buy&demo=true",
      { kind: "create", isDemo: true, productType: "GROUP_BUY" },
    ],
    ["type=pick&product=brand", { kind: "invalid" }],
    ["type=pick&product=", { kind: "invalid" }],
    ["type=recruit", { kind: "comingSoon" }],
    ["type=recruit&product=group-buy", { kind: "comingSoon" }],
    ["type=recruit&product=other", { kind: "invalid" }],
    ["type=PICK", { kind: "invalid" }],
    ["", { kind: "invalid" }],
  ])("%s → %o", (query, expected) => {
    expect(parseRegisterEntry(new URLSearchParams(query))).toEqual(expected);
  });
});

describe("getRegisterRedirectPath", () => {
  function detailOf(
    patch: Pick<CampaignDetail, "stage" | "isDemoCompleted">,
  ): CampaignDetail {
    return { campaignIdx: 7, ...patch } as CampaignDetail;
  }

  it("등록 중이면 작성 화면에 머문다", () => {
    expect(
      getRegisterRedirectPath(
        detailOf({ stage: "DRAFT", isDemoCompleted: false }),
      ),
    ).toBeNull();
  });

  it("반려면 수정 모드로 작성 화면에 머문다(스펙 §3 반려 후 수정)", () => {
    expect(
      getRegisterRedirectPath(
        detailOf({ stage: "REJECTED", isDemoCompleted: false }),
      ),
    ).toBeNull();
  });

  it.each(["REVIEWING", "IN_PROGRESS", "ENDED"] as const)(
    "%s면 등록 내역으로 보낸다",
    (stage) => {
      expect(
        getRegisterRedirectPath(detailOf({ stage, isDemoCompleted: false })),
      ).toBe("/campaign/7");
    },
  );

  it("작성을 마친 데모는 등록 중이어도 기본 정보로 보낸다", () => {
    expect(
      getRegisterRedirectPath(
        detailOf({ stage: "DRAFT", isDemoCompleted: true }),
      ),
    ).toBe("/campaign/7");
  });
});

describe("getDetailRedirectPath", () => {
  function detailOf(
    patch: Pick<CampaignDetail, "stage" | "isDemoCompleted">,
  ): CampaignDetail {
    return { campaignIdx: 7, ...patch } as CampaignDetail;
  }

  it("등록 중이면 작성 화면으로 보낸다", () => {
    expect(
      getDetailRedirectPath(
        detailOf({ stage: "DRAFT", isDemoCompleted: false }),
      ),
    ).toBe("/campaign/register/7");
  });

  it("작성을 마친 데모는 등록 내역에 머문다", () => {
    expect(
      getDetailRedirectPath(
        detailOf({ stage: "DRAFT", isDemoCompleted: true }),
      ),
    ).toBeNull();
  });

  it.each(["REVIEWING", "REJECTED", "IN_PROGRESS", "ENDED"] as const)(
    "%s면 등록 내역에 머문다",
    (stage) => {
      expect(
        getDetailRedirectPath(detailOf({ stage, isDemoCompleted: false })),
      ).toBeNull();
    },
  );
});
