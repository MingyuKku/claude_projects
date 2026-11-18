// API가 나오기 전 개발 서버에서 쓰는 목 파일 보관소. 올린 파일을 브라우저 안에 두고 `attachmentIdx`로 미리보기 주소를 찾음.
// 서버 파일을 번호로 가리키는 실제 API(업로드 → `attachmentIdx`를 다른 요청에 넣음)를 흉내 내려고 업로드한 쪽과 쓰는 쪽(업로드 API,
// 그 번호를 받는 브랜드 추가·소개서 저장)이 슬라이스가 달라 shared에 둠. 주소는 새로고침하면 사라지는 `blob:` 주소임.

export interface MockFile {
  attachmentIdx: number;
  url: string;
  mediaType: "IMAGE" | "VIDEO";
}

const fileByAttachmentIdx = new Map<number, MockFile>();
let sequence = 0;

export function registerMockFile(file: Blob): MockFile {
  sequence += 1;
  // 새로고침 뒤에도 목 저장소에 남은 옛 번호와 겹치지 않게 시각을 섞음.
  const attachmentIdx = Date.now() * 1000 + (sequence % 1000);
  const registered: MockFile = {
    attachmentIdx,
    url: URL.createObjectURL(file),
    mediaType: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
  };
  fileByAttachmentIdx.set(attachmentIdx, registered);
  return registered;
}

/** 올린 파일. 모르는 번호면 null. */
export function getMockFile(attachmentIdx: number) {
  return fileByAttachmentIdx.get(attachmentIdx) ?? null;
}

/** 올린 파일의 미리보기 주소. 모르는 번호면 null. */
export function getMockFileUrl(attachmentIdx: number) {
  return getMockFile(attachmentIdx)?.url ?? null;
}
