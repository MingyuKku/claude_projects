import { ApiError } from "@/shared/api";

import { readApiErrorMessage, readApiErrorReason } from "./api-error";

describe("api error readers", () => {
  it("reads reason and message from an ApiError body", () => {
    expect(
      readApiErrorReason(new ApiError(400, { reason: "contains id" })),
    ).toBe("contains id");
    expect(readApiErrorMessage(new ApiError(400, { message: "boom" }))).toBe(
      "boom",
    );
  });

  it("falls back for other shapes and non-API errors", () => {
    expect(readApiErrorReason(new ApiError(500, "text"))).toBeUndefined();
    expect(readApiErrorReason(new Error("x"))).toBeUndefined();
    expect(readApiErrorMessage(new ApiError(500, undefined))).toBe("");
  });
});
