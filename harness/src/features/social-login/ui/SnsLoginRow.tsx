import { useEffect } from "react";
import { useNavigate } from "react-router";

import { SnsButton } from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";

import { loginWithApple } from "../api/complete-login";
import { preloadAppleSdk } from "../lib/apple-authorize";
import { startGoogleLogin } from "../lib/google-login";
import { startKakaoLogin } from "../lib/kakao-login";
import { startNaverLogin } from "../lib/naver-login";
import { socialPlatformSchema } from "../model/schema";

interface SnsLoginRowProps {
  /** 공급자 화면·팝업을 열지 못함(스크립트 로드 실패, SDK 없음). */
  onErrorStart: () => void;
  /** 애플 팝업 뒤 로그인이 거절되거나 실패함. 다른 공급자는 복귀 화면이 로그인 화면에 실패 state를 넘김. */
  onFailLogin: () => void;
}

export function SnsLoginRow({ onErrorStart, onFailLogin }: SnsLoginRowProps) {
  const navigate = useNavigate();

  // 애플은 팝업이라 클릭 직후에 열려야 브라우저가 막지 않음. 미리 불러 두고 실패는 클릭할 때 다시 시도해 알림.
  useEffect(() => {
    preloadAppleSdk().catch(() => undefined);
  }, []);

  // 애플은 팝업이라 페이지가 바뀌지 않으므로 콜백 화면 없이 여기서 결과대로 이동함. 취소는 안내 없이 머물고 실패는 알림.
  async function startAppleLogin() {
    const outcome = await loginWithApple();
    if (outcome.status === "success") {
      void navigate(ROUTES.main);
    } else if (outcome.status === "needsLink") {
      void navigate(ROUTES.snsLink, { state: { snsData: outcome.snsData } });
    } else if (outcome.status === "failed") {
      onFailLogin();
    }
  }

  function createClickHandler(start: () => Promise<void>) {
    return () => {
      start().catch((error: unknown) => {
        // 원인은 콘솔에 남기고, 화면에는 번역된 안내만 보여 준다.
        console.error(error);
        onErrorStart();
      });
    };
  }

  return (
    <div className="flex items-center justify-center gap-5">
      <SnsButton
        platform={socialPlatformSchema.enum.kakao}
        size="small"
        onClick={createClickHandler(startKakaoLogin)}
      />
      <SnsButton
        platform={socialPlatformSchema.enum.naver}
        size="small"
        iconClassName="p-0.5"
        onClick={createClickHandler(startNaverLogin)}
      />
      <SnsButton
        platform={socialPlatformSchema.enum.apple}
        size="small"
        onClick={createClickHandler(startAppleLogin)}
      />
      <SnsButton
        platform={socialPlatformSchema.enum.google}
        size="small"
        onClick={createClickHandler(startGoogleLogin)}
      />
    </div>
  );
}
