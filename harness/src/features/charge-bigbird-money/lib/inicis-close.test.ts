import { buildInicisCloseScriptUrl } from "./inicis-close";

describe("buildInicisCloseScriptUrl", () => {
  it("테스트 표준결제 스크립트 주소에서 같은 호스트의 닫기 스크립트 주소를 만든다", () => {
    expect(
      buildInicisCloseScriptUrl(
        "https://stgstdpay.inicis.com/stdjs/INIStdPay.js",
      ),
    ).toBe("https://stgstdpay.inicis.com/stdjs/INIStdPay_close.js");
  });

  it("운영 표준결제 스크립트 주소에서도 만든다", () => {
    expect(
      buildInicisCloseScriptUrl("https://stdpay.inicis.com/stdjs/INIStdPay.js"),
    ).toBe("https://stdpay.inicis.com/stdjs/INIStdPay_close.js");
  });

  it("쿼리와 해시는 지운다", () => {
    expect(
      buildInicisCloseScriptUrl(
        "https://stdpay.inicis.com/stdjs/INIStdPay.js?v=1#x",
      ),
    ).toBe("https://stdpay.inicis.com/stdjs/INIStdPay_close.js");
  });

  it.each([
    ["이니시스가 아닌 호스트", "https://evil.example.com/stdjs/INIStdPay.js"],
    [
      "호스트에 이니시스 이름만 붙은 주소",
      "https://stdpay.inicis.com.evil.com/stdjs/INIStdPay.js",
    ],
    ["http 주소", "http://stdpay.inicis.com/stdjs/INIStdPay.js"],
    [
      "표준결제 스크립트가 아닌 파일",
      "https://stdpay.inicis.com/stdjs/other.js",
    ],
    ["주소가 아닌 값", "not a url"],
    ["빈 값", ""],
  ])("%s는 null이다", (_name, url) => {
    expect(buildInicisCloseScriptUrl(url)).toBeNull();
  });

  it("값이 없으면 null이다", () => {
    expect(buildInicisCloseScriptUrl(undefined)).toBeNull();
  });
});
