/**
 * 화면이 없는 대상을 열었을 때 렌더 중에 던지는 오류(없는 캠페인, 잘못된 주소 값). 라우트의 오류 화면이 알 수 없는 경로와 같은 not-found 화면으로 보여 줌.
 * `data(null, { status: 404 })`는 loader에서 던질 때만 라우트 응답으로 바뀌고, 렌더 중에 던지면 일반 오류로 취급돼서 이 클래스를 씀.
 */
export class NotFoundError extends Error {
  constructor() {
    super("Not found");
    this.name = "NotFoundError";
  }
}
