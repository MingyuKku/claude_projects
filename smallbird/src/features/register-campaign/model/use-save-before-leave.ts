import { useEffect, useRef } from "react";
import { useBlocker } from "react-router";

import { useSaveResultHandler } from "./use-save-result-handler";
import { useDraftSaver, useRegisterWizardStoreApi } from "./wizard-context";

/**
 * 헤더 "<"·브라우저 뒤로가기 등 앱 안에서 작성 화면을 떠날 때 먼저 저장하고 나감(사용자 답 P-24, 알럿 없음).
 * 저장이 실패해도 토스트만 띄운 실패면 서버 장애에 갇히지 않게 그대로 나가고, 수정 불가 등 알럿으로 처리한 실패는 머묾. 탭 닫기·새로고침·주소 직접 입력은 브라우저가 기다려 주지 않아 저장을 보장하지 못함.
 */
export function useSaveBeforeLeave() {
  const saver = useDraftSaver();
  const store = useRegisterWizardStoreApi();
  const handleFailedSave = useSaveResultHandler();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname &&
      !store.getState().isLeaveAllowed &&
      saver.hasChanges({ skipUnseenDefaults: true }),
  );
  // blocker 객체와 실패 처리 함수는 렌더마다 새로 만들어져 effect가 다시 돌므로, 막힌 이동 하나에 저장을 한 번만 보냄.
  const isSavingRef = useRef(false);

  useEffect(() => {
    // 저장이 끝나 이동을 정한 뒤에도 라우터가 상태를 바꾸기 전 렌더에서는 아직 막힘으로 보여, 막힘이 풀린 것을 본 뒤에 다시 받음.
    if (blocker.state !== "blocked") {
      isSavingRef.current = false;
      return;
    }
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    // 헤더 "<"·브라우저 뒤로가기도 피드백을 받게 "다음"에 Loading을 표시함.
    store.getState().startPendingSave("leave");
    void saver.save({ skipUnseenDefaults: true }).then((result) => {
      const canLeave = result.ok || handleFailedSave(result);
      if (canLeave) blocker.proceed();
      else blocker.reset();
      store.getState().endPendingSave("leave");
    });
  }, [blocker, saver, store, handleFailedSave]);
}
