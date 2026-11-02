// 라우터를 거치지 않고 페이지를 새로 불러오며 이동한다. 현재 기록을 대체하므로 뒤로 가기로 돌아오지 않는다.
// 계정이 바뀌는 등 메모리의 서버 캐시와 진행 중 요청을 모두 버려야 할 때 쓴다.
// jsdom 의 window.location 은 테스트에서 바꿔 끼울 수 없으므로(vmThreads 풀), 테스트는 이 함수를 목킹한다.
export function hardNavigate(path: string) {
  window.location.replace(path);
}
