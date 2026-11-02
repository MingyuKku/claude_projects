import { mapExpiredError, readExpiredErrorReason } from "./map-expired-error";

describe("mapExpiredError", () => {
  it.each([
    ["contains personal info", "containsPersonalInfo"],
    [
      "NEW PASSWORD AND CHECK PASSWORD CAN NOT BE DIFFERENCE.",
      "passwordsDiffer",
    ],
    ["NOT REACHED SEMI ANNUAL.", "notReachedSemiAnnual"],
    ["NEW PASSWORD CAN NOT BE SAME ORIGINAL PASSWORD.", "sameAsOriginal"],
    ["ORIGINAL PASSWORD INVALID.", "originalInvalid"],
    ["unknown", "fallback"],
    [undefined, "fallback"],
  ])("%s -> %s", (reason, expected) => {
    expect(mapExpiredError(reason)).toBe(expected);
  });
});

describe("readExpiredErrorReason", () => {
  it("reads the reason field", () => {
    expect(readExpiredErrorReason({ reason: "x" })).toBe("x");
  });

  it("returns undefined for unexpected bodies", () => {
    expect(readExpiredErrorReason(null)).toBeUndefined();
    expect(readExpiredErrorReason({ reason: 1 })).toBeUndefined();
  });
});
