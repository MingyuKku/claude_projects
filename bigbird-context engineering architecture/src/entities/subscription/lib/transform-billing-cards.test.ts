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
        },
      ]),
    ).toEqual([
      {
        id: "32",
        issuer: "BC카드",
        maskedNumber: "1234-56**-****-***7",
        isDefault: true,
      },
    ]);
  });
});
