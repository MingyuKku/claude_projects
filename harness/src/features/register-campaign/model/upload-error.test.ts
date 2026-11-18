import { ApiError } from "@/shared/api";

import { getUploadErrorKey, getUploadErrorKeyByReason } from "./upload-error";

function failure(reason: string) {
  return new ApiError(400, { result: false, reason });
}

describe("getUploadErrorKey", () => {
  it("형식·이미지 용량·동영상 용량 초과는 각각 안내 문구로 보낸다", () => {
    expect(getUploadErrorKey(failure("INVALID_FILE_TYPE"))).toBe(
      "toast.fileType",
    );
    expect(getUploadErrorKey(failure("FILE_TOO_LARGE"))).toBe("toast.fileSize");
    expect(getUploadErrorKey(failure("max upload size error"))).toBe(
      "toast.videoSize",
    );
  });

  it("그 밖의 오류는 일반 실패 문구로 보낸다", () => {
    expect(getUploadErrorKey(failure("FILE_UPLOAD_FAILED"))).toBe(
      "toast.saveFailed",
    );
    expect(getUploadErrorKey(new Error("network"))).toBe("toast.saveFailed");
  });
});

describe("getUploadErrorKeyByReason", () => {
  it("서버 사유로 안내 문구를 고르고, 모르거나 없으면 일반 실패 문구로 보낸다", () => {
    expect(getUploadErrorKeyByReason("FILE_TOO_LARGE")).toBe("toast.fileSize");
    expect(getUploadErrorKeyByReason("OTHER")).toBe("toast.saveFailed");
    expect(getUploadErrorKeyByReason(undefined)).toBe("toast.saveFailed");
  });
});
