import { checkDetailMediaFile, checkImageFile } from "./file-rules";

const MB = 1024 * 1024;

function fileOf(type: string, size: number) {
  const file = new File(["x"], "f", { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("checkImageFile", () => {
  it("JPG·PNG 10MB 이하만 받는다", () => {
    expect(checkImageFile(fileOf("image/png", 10 * MB))).toBeNull();
    expect(checkImageFile(fileOf("image/png", 10 * MB + 1))).toBe("size");
    expect(checkImageFile(fileOf("image/gif", MB))).toBe("type");
  });
});

describe("checkDetailMediaFile", () => {
  it("동영상은 500MB 이하만 받는다", () => {
    expect(checkDetailMediaFile(fileOf("video/mp4", 500 * MB))).toBeNull();
    expect(checkDetailMediaFile(fileOf("video/mp4", 500 * MB + 1))).toBe(
      "videoSize",
    );
  });

  it("이미지는 이미지 규칙을 따른다", () => {
    expect(checkDetailMediaFile(fileOf("image/jpeg", 11 * MB))).toBe("size");
  });
});
