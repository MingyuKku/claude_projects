import { buildChargePaths } from "./redirect-uri";

describe("buildChargePaths", () => {
  it("결제 서버에 보낼 복귀·닫기 경로를 만든다", () => {
    expect(buildChargePaths()).toEqual({
      redirectUri: "/mypage/money",
      closeUrl: "/inicis/close",
    });
  });

  it("복귀 경로에는 쿼리를 붙이지 않는다(서버가 뒤에 이어 붙임)", () => {
    expect(buildChargePaths().redirectUri).not.toContain("?");
  });
});
