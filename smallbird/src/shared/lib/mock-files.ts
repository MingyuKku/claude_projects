// API가 나오기 전 개발 서버에서 쓰는 목 파일 보관소. 올린 파일을 브라우저 안에 두고 `fileId`로 미리보기 주소를 찾음.
// 서버 파일을 `fileId`로 가리키는 실제 API(업로드 → `fileId`를 다른 요청에 넣음)를 흉내 내려고 업로드한 쪽과 쓰는 쪽(업로드 API,
// 그 id를 받는 브랜드 추가 등)이 슬라이스가 달라 shared에 둠. 주소는 새로고침하면 사라지는 `blob:` 주소임.

const urlByFileId = new Map<string, string>();
let sequence = 0;

export function registerMockFile(file: Blob) {
  sequence += 1;
  const fileId = `mock-file-${Date.now()}-${sequence}`;
  const url = URL.createObjectURL(file);
  urlByFileId.set(fileId, url);
  return { fileId, url };
}

/** 올린 파일의 미리보기 주소. 모르는 id면 null. */
export function getMockFileUrl(fileId: string) {
  return urlByFileId.get(fileId) ?? null;
}
