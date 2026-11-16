import { getMockFileUrl, registerMockFile } from "./mock-files";

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:mock-url");
});

describe("목 파일 보관소", () => {
  it("올린 파일에 번호를 주고 번호로 미리보기 주소를 찾는다", () => {
    const { attachmentIdx, url } = registerMockFile(new Blob(["a"]));

    expect(url).toBe("blob:mock-url");
    expect(getMockFileUrl(attachmentIdx)).toBe("blob:mock-url");
  });

  it("파일마다 다른 번호를 준다", () => {
    const first = registerMockFile(new Blob(["a"]));
    const second = registerMockFile(new Blob(["b"]));

    expect(first.attachmentIdx).not.toBe(second.attachmentIdx);
  });

  it("모르는 번호는 null이다", () => {
    expect(getMockFileUrl(-1)).toBeNull();
  });
});
