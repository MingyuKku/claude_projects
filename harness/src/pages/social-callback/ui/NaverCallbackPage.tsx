import { useState } from "react";

import {
  completeNaverLink,
  completeNaverLogin,
  readNaverLinkCallback,
  SocialCallbackScreen,
} from "@/features/social-login";

import { LinkCallbackScreen } from "./LinkCallbackScreen";

export function NaverCallbackPage() {
  // 연결하려고 시작해 돌아온 주소인지는 처음 한 번만 정함. 연결을 이어 가면서 의도와 주소 쿼리를 지우므로 다시 읽으면 로그인으로 바뀜.
  const [linkCallback] = useState(() => readNaverLinkCallback());

  if (linkCallback) {
    return (
      <LinkCallbackScreen
        provider="naver"
        completeLink={() =>
          completeNaverLink(linkCallback.code, linkCallback.state)
        }
      />
    );
  }
  return (
    <SocialCallbackScreen
      completeLogin={() => completeNaverLogin(window.location.search)}
    />
  );
}
