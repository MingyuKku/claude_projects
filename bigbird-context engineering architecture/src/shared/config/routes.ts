// 라우트 경로의 단일 출처. features/widgets 가 app 레이어를 임포트하지 않고도
// 링크를 만들 수 있도록 shared 에 둔다 (FSD 는 상위 레이어 임포트를 금지한다).
export const ROUTES = {
  home: "/",
} as const;
