import { registerMockFile } from "@/shared/lib";

// 파일 업로드(A-7)의 목. 브라우저 안에 파일을 두고 번호·미리보기 주소를 돌려줌(새로고침하면 주소가 사라짐).
export async function uploadFile(file: File) {
  return registerMockFile(file);
}
