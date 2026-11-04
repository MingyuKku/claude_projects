// 공급자 로그인 화면 등 다른 사이트로 이동한다. 기록을 남기므로 뒤로 가기로 돌아올 수 있다.
// jsdom 의 window.location 은 테스트에서 바꿔 끼울 수 없으므로(vmThreads 풀), 테스트는 이 함수를 목킹한다.
export function navigateExternal(url: string) {
  window.location.assign(url);
}
