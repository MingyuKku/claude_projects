import { transformUsageList } from "./transform-usage";

const item = {
  id: "BC-12345678901234",
  type: "USE",
  usageDate: "2026-10-23 14:23:18",
  campaignName: "2026 여름 시즌 캠핑 용품 신제품 리뷰",
  campaignCode: "CP0001",
  mainImageUrl: "https://cdn.bigbird.local/campaign.png",
  campaignType: "pick",
  usageDetailCode: "INFLUENCER_CONTRACT_PICK",
  usageDetailName: "인플루언서 계약비용(PICK형)",
  usageAmount: -50000,
  remainingAmount: 1250000,
  contractTarget: { name: "김하루", influencerId: "@haru_beauty" },
};

type ItemOverride = {
  [Key in Exclude<keyof typeof item, "id" | "type">]?:
    (typeof item)[Key] | null;
} & { id?: string; type?: string };

function listOf(...items: ItemOverride[]) {
  return {
    list: items.map((override) => ({ ...item, ...override })),
    count: items.length,
    currentPage: 1,
    entrySize: 10,
  };
}

describe("transformUsageList", () => {
  it("항목을 뷰모델로 바꾸고 쪽 수를 건수와 쪽 크기로 계산한다", () => {
    const result = transformUsageList({
      list: [item],
      count: 41,
      currentPage: 2,
      entrySize: 20,
    });

    expect(result.totalCount).toBe(41);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
    expect(result.records[0]).toMatchObject({
      id: "BC-12345678901234",
      type: "use",
      typeText: "USE",
      campaignName: "2026 여름 시즌 캠핑 용품 신제품 리뷰",
      campaignCode: "CP0001",
      campaignImageUrl: "https://cdn.bigbird.local/campaign.png",
      campaignType: "pick",
      usageDetail: "contractPick",
      usageDetailText: "인플루언서 계약비용(PICK형)",
      amount: -50000,
      remainingAmount: 1250000,
      contractTarget: { name: "김하루", influencerId: "@haru_beauty" },
    });
    expect(result.records[0]?.usedAt).toEqual(new Date("2026-10-23T14:23:18"));
  });

  it("값이 없는 항목은 빈 문자열로 두고 금액은 null로 둔다", () => {
    const { records } = transformUsageList(
      listOf({
        usageDate: null,
        campaignName: "",
        campaignCode: null,
        mainImageUrl: null,
        campaignType: undefined,
        usageDetailCode: null,
        usageDetailName: null,
        usageAmount: undefined,
        remainingAmount: undefined,
        contractTarget: null,
      }),
    );
    expect(records[0]).toMatchObject({
      usedAt: null,
      usedAtText: "",
      campaignName: "",
      campaignCode: "",
      campaignImageUrl: null,
      campaignType: null,
      campaignTypeText: "",
      usageDetail: null,
      usageDetailText: "",
      amount: null,
      remainingAmount: null,
      contractTarget: null,
    });
  });

  it("사용·환급·충전·출금은 구분 코드로 바꾸고 그 밖의 구분은 서버 값을 그대로 둔다", () => {
    const { records } = transformUsageList(
      listOf(
        { type: "REFUND" },
        { type: "CHARGE" },
        { type: "WITHDRAWAL" },
        { type: "constructor" },
        { type: "ETC" },
      ),
    );
    expect(records.map((record) => [record.type, record.typeText])).toEqual([
      ["refund", "REFUND"],
      ["charge", "CHARGE"],
      ["withdraw", "WITHDRAWAL"],
      [null, "constructor"],
      [null, "ETC"],
    ]);
  });

  it("사용 내역 코드 4가지를 화면 코드로 바꾸고 모르는 코드는 서버 문구를 그대로 둔다", () => {
    const { records } = transformUsageList(
      listOf(
        { usageDetailCode: "INFLUENCER_CONTRACT_RECRUIT" },
        { usageDetailCode: "AI_MANUSCRIPT_CONFIRM" },
        { usageDetailCode: "AI_POSTING_GUIDE" },
        { usageDetailCode: "NEW_SERVICE", usageDetailName: "신규 서비스" },
        { usageDetailCode: null, usageDetailName: "매칭거절" },
      ),
    );
    expect(
      records.map((record) => [record.usageDetail, record.usageDetailText]),
    ).toEqual([
      ["contractRecruit", "인플루언서 계약비용(PICK형)"],
      ["aiManuscriptConfirm", "인플루언서 계약비용(PICK형)"],
      ["aiPostingGuide", "인플루언서 계약비용(PICK형)"],
      [null, "신규 서비스"],
      [null, "매칭거절"],
    ]);
  });

  it("캠페인 유형 코드를 바꾸고 모르는 값은 서버 값을 그대로 둔다", () => {
    const { records } = transformUsageList(
      listOf({ campaignType: "recruit" }, { campaignType: "live" }),
    );
    expect(
      records.map((record) => [record.campaignType, record.campaignTypeText]),
    ).toEqual([
      ["recruit", "recruit"],
      [null, "live"],
    ]);
  });

  it("충전·출금은 캠페인 명·코드·유형·사용 내역·계약 대상을 빈칸으로 둔다", () => {
    const { records } = transformUsageList(
      listOf({
        type: "CHARGE",
        campaignName: "-",
        campaignCode: null,
        mainImageUrl: "https://cdn.bigbird.local/campaign.png",
        campaignType: null,
        usageDetailCode: null,
        usageDetailName: null,
        contractTarget: null,
      }),
    );
    expect(records[0]).toMatchObject({
      campaignName: "",
      campaignCode: "",
      campaignImageUrl: null,
      campaignType: null,
      campaignTypeText: "",
      usageDetail: null,
      usageDetailText: "",
      contractTarget: null,
    });
  });

  it("서버 날짜를 읽지 못하면 원문을 그대로 둔다", () => {
    const { records } = transformUsageList(listOf({ usageDate: "어제" }));
    expect(records[0]?.usedAt).toBeNull();
    expect(records[0]?.usedAtText).toBe("어제");
  });
});
