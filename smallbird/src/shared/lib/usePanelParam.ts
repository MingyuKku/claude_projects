import { useLocation, useNavigate, useSearchParams } from "react-router";

interface UsePanelParamOptions<T extends string> {
  /** 허용하는 패널 값. 이 밖의 값은 열려 있지 않은 것으로 봄. */
  panels: readonly T[];
  /** 패널을 담는 쿼리 이름 */
  param?: string;
  /** 패널과 함께 다니는 쿼리(예: 대상 id). 패널을 열고 닫을 때 같이 다룸. */
  linkedParams?: readonly string[];
}

interface PanelState {
  openedPanelInApp: true;
}

function isPanelState(state: unknown): state is PanelState {
  return (
    typeof state === "object" &&
    state !== null &&
    "openedPanelInApp" in state &&
    state.openedPanelInApp === true
  );
}

/**
 * 하위 화면(패널) 상태를 URL 쿼리에 두는 훅. React Router의 Router 컨텍스트 안에서만 쓸 수 있음.
 * - 열기: 기록을 쌓고(push) 앱 안에서 열었다는 표시를 state에 남김.
 * - 열린 채 다른 패널·연결 값으로 바꾸기: 기록을 쌓지 않음(replace).
 * - 닫기: 앱 안에서 연 패널이면 뒤로 가서 기록이 늘지 않게 하고, 주소로 바로 들어온 패널이면 쿼리만 지움(replace).
 */
export function usePanelParam<T extends string>({
  panels,
  param = "panel",
  linkedParams = [],
}: UsePanelParamOptions<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const requested = searchParams.get(param);
  const panel = panels.find((candidate) => candidate === requested) ?? null;
  const isOpenedInApp = isPanelState(state);

  function openPanel(next: T, linked: Record<string, string> = {}) {
    const isSwitching = panel !== null;
    if (
      panel === next &&
      linkedParams.every(
        (key) => (searchParams.get(key) ?? undefined) === linked[key],
      )
    ) {
      return;
    }
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set(param, next);
        for (const key of linkedParams) {
          const value = linked[key];
          if (value === undefined) params.delete(key);
          else params.set(key, value);
        }
        return params;
      },
      {
        replace: isSwitching,
        // 열린 패널을 바꿀 때는 앞서 정해진 "앱 안에서 엶" 표시를 이어받음.
        state:
          isSwitching && !isOpenedInApp
            ? undefined
            : { openedPanelInApp: true },
      },
    );
  }

  function closePanel() {
    if (panel === null) return;
    if (isOpenedInApp) {
      void navigate(-1);
      return;
    }
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete(param);
        for (const key of linkedParams) params.delete(key);
        return params;
      },
      { replace: true },
    );
  }

  return { panel, openPanel, closePanel };
}
