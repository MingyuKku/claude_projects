import { useNavigate } from "react-router";

// React Router가 기록마다 `history.state.idx`(앱 안 기록 순번, 첫 화면 0)를 남김. 주소로 바로 들어와 앱 안 기록이 없으면
// 뒤로 가면 앱을 벗어나므로 대신 지정한 곳으로 보냄.
function hasInAppHistory() {
  const state: unknown = window.history.state;
  return (
    typeof state === "object" &&
    state !== null &&
    "idx" in state &&
    typeof state.idx === "number" &&
    state.idx > 0
  );
}

/** 브라우저 뒤로가기. 앱 안에서 돌아갈 화면이 없으면 `fallbackPath`로 이동함. */
export function useGoBack(fallbackPath: string) {
  const navigate = useNavigate();

  return function goBack() {
    if (hasInAppHistory()) {
      void navigate(-1);
      return;
    }
    void navigate(fallbackPath, { replace: true });
  };
}
