// 서버에 API가 없는 AI 소개서 생성 목(features/register-campaign)이 올린 것처럼 보이는 파일에 번호와 미리보기 주소를 줌.
// 주소는 새로고침하면 사라지는 `blob:` 주소임. 목을 업로드한 쪽과 쓰는 쪽이 슬라이스가 달라 shared에 둠.

export interface MockFile {
  attachmentIdx: number;
  url: string;
  mediaType: "IMAGE" | "VIDEO";
}

let sequence = 0;

export function registerMockFile(file: Blob): MockFile {
  sequence += 1;
  return {
    // 새로고침 뒤에도 번호가 겹치지 않게 시각을 섞음.
    attachmentIdx: Date.now() * 1000 + (sequence % 1000),
    url: URL.createObjectURL(file),
    mediaType: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
  };
}
