import { MAX_IMAGE_BYTES, validateImageFile } from "./image-file";

function file(type: string, size = 10) {
  return new File([new Uint8Array(size)], "a", { type });
}

describe("validateImageFile", () => {
  it("JPG·PNG는 통과한다", () => {
    expect(validateImageFile(file("image/jpeg"))).toBeNull();
    expect(validateImageFile(file("image/png"))).toBeNull();
  });

  it("다른 형식은 format이다", () => {
    expect(validateImageFile(file("image/gif"))).toBe("format");
    expect(validateImageFile(file("video/mp4"))).toBe("format");
    expect(validateImageFile(file(""))).toBe("format");
  });

  it("10MB를 넘으면 size이고, 정확히 10MB는 통과한다", () => {
    expect(validateImageFile(file("image/png", MAX_IMAGE_BYTES))).toBeNull();
    expect(validateImageFile(file("image/png", MAX_IMAGE_BYTES + 1))).toBe(
      "size",
    );
  });
});
