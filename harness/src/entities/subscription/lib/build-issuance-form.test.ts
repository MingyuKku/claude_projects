import { buildIssuanceForm } from "./build-issuance-form";

describe("buildIssuanceForm", () => {
  it("결제창 주소는 action으로, 나머지 값은 이름 그대로 문자열 필드로 둔다", () => {
    expect(
      buildIssuanceForm({
        issuanceUrl: "https://pay.example/issue",
        mid: "INIBillTst",
        price: 99000,
        isTest: true,
        extra: null,
      }),
    ).toEqual({
      action: "https://pay.example/issue",
      fields: { mid: "INIBillTst", price: "99000", isTest: "true", extra: "" },
    });
  });
});
