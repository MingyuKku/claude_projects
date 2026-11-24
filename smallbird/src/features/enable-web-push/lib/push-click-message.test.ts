import { readPushClickLink } from "./push-click-message";

describe("readPushClickLink", () => {
  it("앱 안 경로를 돌려준다", () => {
    expect(
      readPushClickLink({ type: "web-push-click", link: "/mypage?tab=money" }),
    ).toBe("/mypage?tab=money");
  });

  it("다른 종류의 메시지는 무시한다", () => {
    expect(readPushClickLink({ type: "other", link: "/mypage" })).toBeNull();
    expect(readPushClickLink("web-push-click")).toBeNull();
    expect(readPushClickLink(null)).toBeNull();
  });

  it.each(["https://evil.example/", "//evil.example/", "mypage", "/\\evil"])(
    "앱 경로가 아닌 링크(%s)는 무시한다",
    (link) => {
      expect(readPushClickLink({ type: "web-push-click", link })).toBeNull();
    },
  );
});
