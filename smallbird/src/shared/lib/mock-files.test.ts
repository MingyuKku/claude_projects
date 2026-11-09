import { getMockFileUrl, registerMockFile } from "./mock-files";

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:mock-url");
});

describe("목 파일 보관소", () => {
  it("올린 파일에 id를 주고 id로 미리보기 주소를 찾는다", () => {
    const { fileId, url } = registerMockFile(new Blob(["a"]));

    expect(url).toBe("blob:mock-url");
    expect(getMockFileUrl(fileId)).toBe("blob:mock-url");
  });

  it("파일마다 다른 id를 준다", () => {
    const first = registerMockFile(new Blob(["a"]));
    const second = registerMockFile(new Blob(["b"]));

    expect(first.fileId).not.toBe(second.fileId);
  });

  it("모르는 id는 null이다", () => {
    expect(getMockFileUrl("unknown")).toBeNull();
  });
});
