import { useEffect, useRef } from "react";
import { useBlocker } from "react-router";

import { useSaveResultHandler } from "./use-save-result-handler";
import { useDraftSaver, useRegisterWizardStoreApi } from "./wizard-context";

/**
 * 헤더 "<"·브라우저 뒤로가기 등 앱 안에서 작성 화면을 떠날 때 먼저 저장하고 나감(사용자 답 P-24, 알럿 없음).
 * 저장이 실패하면 머물고 실패 처리. 탭 닫기·새로고침·주소 직접 입력은 브라우저가 기다려 주지 않아 저장을 보장하지 못함.
 */
export function useSaveBeforeLeave() {
  const saver = useDraftSaver();
  const store = useRegisterWizardStoreApi();
  const handleFailedSave = useSaveResultHandler();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname &&
      !store.getState().isLeaveAllowed &&
      saver.hasChanges(),
  );
  // blocker 객체와 실패 처리 함수는 렌더마다 새로 만들어져 effect가 다시 돌므로, 막힌 이동 하나에 저장을 한 번만 보냄.
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (blocker.state !== "blocked" || isSavingRef.current) return;
    isSavingRef.current = true;
    void saver.save().then((result) => {
      isSavingRef.current = false;
      if (result.ok) {
        blocker.proceed();
        return;
      }
      blocker.reset();
      handleFailedSave(result);
    });
  }, [blocker, saver, handleFailedSave]);
}
