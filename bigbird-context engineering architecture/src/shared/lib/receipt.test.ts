import { toReceiptUrl } from "./receipt";

describe("toReceiptUrl", () => {
  it("https 주소만 열 수 있다", () => {
    expect(toReceiptUrl("https://iniweb.inicis.com/receipt?tid=1")).toBe(
      "https://iniweb.inicis.com/receipt?tid=1",
    );
  });

  it("http나 다른 스킴이나 형식이 틀린 값, 빈 값은 null이다", () => {
    expect(toReceiptUrl("http://example.com/a")).toBeNull();
    expect(toReceiptUrl("javascript:alert(1)")).toBeNull();
    expect(toReceiptUrl("not a url")).toBeNull();
    expect(toReceiptUrl("")).toBeNull();
    expect(toReceiptUrl(null)).toBeNull();
  });
});
