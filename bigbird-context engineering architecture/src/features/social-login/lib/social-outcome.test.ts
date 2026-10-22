import { parseAppleCallback, readAuthorization } from "./social-outcome";

describe("readAuthorization", () => {
  it("joins token type and access token", () => {
    expect(
      readAuthorization({
        code: "C01",
        tokenResponse: { tokenType: "Bearer ", accessToken: "abc" },
      }),
    ).toBe("Bearer abc");
  });

  it("returns an empty string when there is no token", () => {
    expect(readAuthorization({ code: "C01" })).toBe("");
  });
});

describe("parseAppleCallback", () => {
  it("fails unless status is success", () => {
    expect(parseAppleCallback("?status=fail&code=C01")).toEqual({
      status: "failed",
    });
    expect(parseAppleCallback("")).toEqual({ status: "failed" });
  });

  it("builds a bearer authorization for C01", () => {
    expect(
      parseAppleCallback("?status=success&code=C01&idtoken=a%20b"),
    ).toEqual({ status: "success", authorization: "Bearer a b" });
  });

  it("returns the identity for C02", () => {
    expect(
      parseAppleCallback("?status=success&code=C02&uid=u1&email=a%40b.com"),
    ).toEqual({ status: "needsLink", uid: "u1", email: "a@b.com" });
  });

  it("fails for an unknown code", () => {
    expect(parseAppleCallback("?status=success&code=C99")).toEqual({
      status: "failed",
    });
  });
});
