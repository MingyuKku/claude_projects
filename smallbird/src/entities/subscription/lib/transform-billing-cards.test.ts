import { transformBillingCards } from "./transform-billing-cards";

describe("transformBillingCards", () => {
  it("서버가 준 마스킹 번호와 기본 카드 여부를 그대로 담는다", () => {
    expect(
      transformBillingCards([
        {
          id: "32",
          issuer: "BC카드",
          maskedNumber: "1234-56**-****-***7",
          isDefault: true,
          cardKind: "debit",
        },
      ]),
    ).toEqual([
      {
        id: "32",
        issuer: "BC카드",
        maskedNumber: "1234-56**-****-***7",
        isDefault: true,
        cardKind: "debit",
      },
    ]);
  });

  it("기본 카드를 맨 앞에 두고 나머지는 서버 순서를 지킨다", () => {
    const card = (id: string, isDefault: boolean) => ({
      id,
      issuer: "하나카드",
      maskedNumber: "1234-56**-****-***7",
      isDefault,
      cardKind: null,
    });
    expect(
      transformBillingCards([
        card("1", false),
        card("2", true),
        card("3", false),
      ]).map(({ id }) => id),
    ).toEqual(["2", "1", "3"]);
  });
});
