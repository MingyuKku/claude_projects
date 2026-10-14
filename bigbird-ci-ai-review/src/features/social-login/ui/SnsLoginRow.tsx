import { SnsButton } from "@/shared/components/auth";

import {
  startAppleLogin,
  startGoogleLogin,
  startKakaoLogin,
  startNaverLogin,
} from "../lib/start-login";
import { START_FAILED_MESSAGE } from "../model/constants";

interface SnsLoginRowProps {
  onSuccessKakao: () => void;
  onErrorStart: (message: string) => void;
}

export function SnsLoginRow({
  onSuccessKakao,
  onErrorStart,
}: SnsLoginRowProps) {
  function run(start: () => Promise<void>) {
    return () => {
      start().catch((error: unknown) => {
        onErrorStart(
          error instanceof Error ? error.message : START_FAILED_MESSAGE,
        );
      });
    };
  }

  return (
    <div className="flex items-center justify-center gap-5">
      <SnsButton
        platform="kakao"
        size="small"
        onClick={run(() => startKakaoLogin(onSuccessKakao))}
      />
      <SnsButton
        platform="naver"
        size="small"
        iconClassName="p-0.5"
        onClick={run(startNaverLogin)}
      />
      <SnsButton platform="apple" size="small" onClick={run(startAppleLogin)} />
      <SnsButton
        platform="google"
        size="small"
        onClick={run(startGoogleLogin)}
      />
    </div>
  );
}
