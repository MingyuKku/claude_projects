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
  onErrorStart: () => void;
}

export function SnsLoginRow({ onErrorStart }: SnsLoginRowProps) {
  const navigate = useNavigate();

  // 애플은 팝업이라 클릭 직후에 열려야 브라우저가 막지 않음. 미리 불러 두고 실패는 클릭할 때 다시 시도해 알림.
  useEffect(() => {
    preloadAppleSdk().catch(() => undefined);
  }, []);

  // 애플은 팝업이라 페이지가 바뀌지 않으므로 콜백 화면 없이 여기서 결과대로 이동함. 취소·거절은 문구 없이 화면에 머묾.
  async function startAppleLogin() {
    const outcome = await loginWithApple();
    if (outcome.status === "success") {
      void navigate(ROUTES.main);
    } else if (outcome.status === "needsLink") {
      void navigate(ROUTES.snsLink, { state: { snsData: outcome.snsData } });
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
