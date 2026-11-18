/** 받은 파일을 브라우저의 저장(다운로드)으로 넘김. 임시 주소는 저장을 시작한 뒤 바로 풀어 메모리를 돌려줌. */
export function saveFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // 일부 브라우저는 click 직후 바로 풀면 저장이 시작되지 않아 다음 턴에 풂.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
