import { landingDestination } from "./landing";

describe("landingDestination", () => {
  it("sends MASTER to the in-app dashboard", () => {
    expect(landingDestination("MASTER")).toEqual({
      kind: "internal",
      path: "/main",
    });
  });

  it("sends ADMIN to the in-app dashboard", () => {
    expect(landingDestination("ADMIN")).toEqual({
      kind: "internal",
      path: "/main",
    });
  });

  it("sends SUB to the legacy account page", () => {
    expect(landingDestination("SUB")).toEqual({
      kind: "legacy",
      path: "/account",
    });
  });

  it("falls back to the narrower destination without authority", () => {
    expect(landingDestination(undefined).kind).toBe("legacy");
    expect(landingDestination("").kind).toBe("legacy");
  });

  it("does not treat differently cased authority as valid", () => {
    expect(landingDestination("master").kind).toBe("legacy");
    expect(landingDestination("Admin").kind).toBe("legacy");
  });
});
