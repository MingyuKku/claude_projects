import { mapChangeError, readChangeErrorMessage } from "./map-change-error";

describe("mapChangeError", () => {
  it.each([
    ["contains id", "containsId"],
    ["contains personal info", "containsPersonalInfo"],
    ["time out", "timeOut"],
    ["something else", "fallback"],
    [undefined, "fallback"],
  ])("%s -> %s", (message, expected) => {
    expect(mapChangeError(message)).toBe(expected);
  });
});

describe("readChangeErrorMessage", () => {
  it("reads the message field", () => {
    expect(readChangeErrorMessage({ message: "time out" })).toBe("time out");
  });

  it("returns undefined for unexpected bodies", () => {
    expect(readChangeErrorMessage("oops")).toBeUndefined();
    expect(readChangeErrorMessage(undefined)).toBeUndefined();
    expect(readChangeErrorMessage({ message: 1 })).toBeUndefined();
  });
});
