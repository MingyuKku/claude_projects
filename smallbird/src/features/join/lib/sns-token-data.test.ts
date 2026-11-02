import { readSnsTokenData } from "./sns-token-data";

describe("readSnsTokenData", () => {
  it("returns the identity from router state", () => {
    const tokenData = { platform: "kakao", email: "a@b.co", uid: "1" };
    expect(readSnsTokenData({ tokenData })).toEqual(tokenData);
  });

  it.each([
    null,
    undefined,
    "x",
    {},
    { tokenData: null },
    { tokenData: { platform: 1 } },
  ])("returns null for %j", (state) => {
    expect(readSnsTokenData(state)).toBeNull();
  });
});
