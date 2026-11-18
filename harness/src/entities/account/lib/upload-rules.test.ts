import {
  checkUploadFile,
  DOCUMENT_EXTENSIONS,
  formatFileSize,
  IMAGE_EXTENSIONS,
  MAX_UPLOAD_BYTES,
} from "./upload-rules";

describe("checkUploadFile", () => {
  it("허용 형식이고 10MB 이하면 통과한다(대소문자 무관)", () => {
    expect(
      checkUploadFile(
        { name: "사업자.PDF", size: MAX_UPLOAD_BYTES },
        DOCUMENT_EXTENSIONS,
      ),
    ).toBeNull();
  });

  it("10MB를 1바이트라도 넘으면 용량 위반이다", () => {
    expect(
      checkUploadFile(
        { name: "a.png", size: MAX_UPLOAD_BYTES + 1 },
        DOCUMENT_EXTENSIONS,
      ),
    ).toBe("size");
  });

  it("회원가입이 허용하던 gif·bmp는 마이페이지에서 거부한다", () => {
    expect(
      checkUploadFile({ name: "a.gif", size: 1 }, DOCUMENT_EXTENSIONS),
    ).toBe("extension");
    expect(checkUploadFile({ name: "a.bmp", size: 1 }, IMAGE_EXTENSIONS)).toBe(
      "extension",
    );
  });

  it("프로필 이미지는 PDF를 거부한다", () => {
    expect(checkUploadFile({ name: "a.pdf", size: 1 }, IMAGE_EXTENSIONS)).toBe(
      "extension",
    );
  });

  it("형식과 용량이 모두 틀리면 형식을 먼저 알린다", () => {
    expect(
      checkUploadFile(
        { name: "a.zip", size: MAX_UPLOAD_BYTES + 1 },
        DOCUMENT_EXTENSIONS,
      ),
    ).toBe("extension");
  });

  it("확장자가 없으면 형식 위반이다", () => {
    expect(
      checkUploadFile({ name: "noext", size: 1 }, DOCUMENT_EXTENSIONS),
    ).toBe("extension");
  });
});

describe("formatFileSize", () => {
  it("단위를 크기에 맞춘다", () => {
    expect(formatFileSize(512)).toBe("512Bytes");
    expect(formatFileSize(2048)).toBe("2KB");
    expect(formatFileSize(5.5 * 1024 * 1024)).toBe("5.5MB");
  });
});
