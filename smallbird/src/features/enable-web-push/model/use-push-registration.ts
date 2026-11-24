import { useEffect } from "react";

import { registerThisDevice } from "./register-this-device";

// 셸이 레이아웃마다 다시 만들어져도 같은 사용자는 한 번만 등록함. 로그아웃은 페이지를 다시 불러와 이 값도 비워짐.
let registeredUserIdx: number | undefined;

/** 로그인한 사용자가 정해지거나 바뀔 때(로그인·새로고침·계정 전환) 이 기기를 등록함. */
export function usePushRegistration(userIdx: number | undefined): void {
  useEffect(() => {
    if (userIdx === undefined || registeredUserIdx === userIdx) return;
    void registerThisDevice().then((isRegistered) => {
      if (isRegistered) registeredUserIdx = userIdx;
    });
  }, [userIdx]);
}
