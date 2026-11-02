import appleIcon from "@/shared/assets/img/platform/apple.svg";
import googleIcon from "@/shared/assets/img/platform/google.svg";
import kakaoIcon from "@/shared/assets/img/platform/kakao.svg";
import naverIcon from "@/shared/assets/img/platform/naver.svg";
import { cn } from "@/shared/lib/utils";

import type { SocialProvider } from "@/entities/account";

// 브랜드 색·로고는 각 플랫폼 가이드를 따르고 로그인 화면(SnsButton)과 같은 토큰·자산을 씀.
const ICON_BOX_CLASS_NAME: Record<SocialProvider, string> = {
  kakao: "bg-kakao-bg",
  naver: "bg-naver-bg",
  apple: "bg-apple-bg",
  google: "border border-google-border bg-google-bg",
};

const ICON_SRC: Record<SocialProvider, string> = {
  kakao: kakaoIcon,
  naver: naverIcon,
  apple: appleIcon,
  google: googleIcon,
};

interface SocialIconProps {
  provider: SocialProvider;
}

// 시안의 24px 브랜드 아이콘(행 앞).
export function SocialIcon({ provider }: SocialIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md",
        ICON_BOX_CLASS_NAME[provider],
      )}
    >
      <img src={ICON_SRC[provider]} alt="" className="size-3.5" />
    </span>
  );
}
