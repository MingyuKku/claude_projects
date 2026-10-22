import { SnsButton } from "@/shared/components/auth";

import {
  startAppleLogin,
  startGoogleLogin,
  startKakaoLogin,
  startNaverLogin,
} from "../lib/start-login";
import { socialPlatformSchema } from "../model/schema";

interface SnsLoginRowProps {
  onSuccessKakao: () => void;
  onErrorStart: () => void;
}

export function SnsLoginRow({
  onSuccessKakao,
  onErrorStart,
}: SnsLoginRowProps) {
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
        onClick={createClickHandler(() => startKakaoLogin(onSuccessKakao))}
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
