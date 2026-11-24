import { registerMockFile } from "./mock-files";

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:mock-url");
});

describe("목 파일", () => {
  it("올린 파일의 미리보기 주소와 종류를 준다", () => {
    expect(
      registerMockFile(new Blob(["a"], { type: "image/png" })),
    ).toMatchObject({ url: "blob:mock-url", mediaType: "IMAGE" });
    expect(
      registerMockFile(new Blob(["v"], { type: "video/mp4" })).mediaType,
    ).toBe("VIDEO");
  });

  it("파일마다 다른 번호를 준다", () => {
    const first = registerMockFile(new Blob(["a"]));
    const second = registerMockFile(new Blob(["b"]));

    expect(first.attachmentIdx).not.toBe(second.attachmentIdx);
  });
});
