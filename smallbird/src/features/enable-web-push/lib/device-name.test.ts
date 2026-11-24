import { createDeviceName } from "./device-name";

const CHROME_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const EDGE_WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0";
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const FIREFOX_LINUX =
  "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

describe("createDeviceName", () => {
  it("브라우저와 운영체제를 이어 만든다", () => {
    expect(createDeviceName(CHROME_MAC)).toBe("Chrome on macOS");
    expect(createDeviceName(FIREFOX_LINUX)).toBe("Firefox on Linux");
  });

  it("Chrome이 들어 있는 UA에서도 Edge를 먼저 찾는다", () => {
    expect(createDeviceName(EDGE_WINDOWS)).toBe("Edge on Windows");
  });

  it("iPhone은 macOS가 아니라 iOS로 본다", () => {
    expect(createDeviceName(SAFARI_IPHONE)).toBe("Safari on iOS");
  });

  it("Android는 Linux가 아니라 Android로 본다", () => {
    expect(createDeviceName(CHROME_ANDROID)).toBe("Chrome on Android");
  });

  it("브라우저가 알려 주는 플랫폼이 있으면 운영체제로 쓴다", () => {
    expect(createDeviceName(CHROME_MAC, "Windows")).toBe("Chrome on Windows");
  });

  it("브라우저만 알면 브라우저 이름만 쓴다", () => {
    expect(createDeviceName("Safari/604.1")).toBe("Safari");
  });

  it("아무것도 해석하지 못하면 기본 이름을 쓴다", () => {
    expect(createDeviceName("")).toBe("Web browser");
  });

  it("100자를 넘기지 않는다", () => {
    expect(createDeviceName(CHROME_MAC, "x".repeat(200))).toHaveLength(100);
  });
});
