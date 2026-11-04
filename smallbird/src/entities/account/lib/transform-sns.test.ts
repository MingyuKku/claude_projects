import { accountSnsListSchema } from "../model/mypage-schema";
import { transformSnsListToLinks } from "./transform-sns";

describe("transformSnsListToLinks", () => {
  it("연결 여부와 이메일을 SNS별로 옮기고, 연결 안 된 이메일은 null로 둔다", () => {
    const links = transformSnsListToLinks(
      accountSnsListSchema.parse({
        items: [
          { platform: "kakao", linked: true, email: "k@example.com" },
          { platform: "naver", linked: false, email: null },
          { platform: "google", linked: true, email: "" },
          { platform: "apple", linked: false },
        ],
      }),
    );
    expect(links.kakao).toEqual({ isLinked: true, email: "k@example.com" });
    expect(links.naver).toEqual({ isLinked: false, email: null });
    expect(links.google).toEqual({ isLinked: true, email: null });
    expect(links.apple).toEqual({ isLinked: false, email: null });
  });

  it("응답에 없는 SNS는 연결 안 됨으로, 모르는 SNS는 버린다", () => {
    const links = transformSnsListToLinks(
      accountSnsListSchema.parse({
        items: [{ platform: "facebook", linked: true, email: "f@example.com" }],
      }),
    );
    expect(Object.keys(links)).toEqual(["kakao", "naver", "google", "apple"]);
    expect(links.kakao.isLinked).toBe(false);
  });
});
