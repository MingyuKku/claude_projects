import facebookIcon from "@/shared/assets/img/sns/facebook.svg";
import instagramIcon from "@/shared/assets/img/sns/instagram.svg";
import naverIcon from "@/shared/assets/img/sns/naver.svg";
import tiktokIcon from "@/shared/assets/img/sns/tiktok.svg";
import { cn } from "@/shared/lib/utils";

import type { InfluencerPlatform } from "../model/platforms";

const PLATFORM_ICON_SRC: Record<InfluencerPlatform, string> = {
  instagram: instagramIcon,
  naver: naverIcon,
  tiktok: tiktokIcon,
  facebook: facebookIcon,
};

interface PlatformIconProps {
  platform: InfluencerPlatform;
  className?: string;
}

/** 플랫폼 로고(기본 20px). 이름은 옆 텍스트가 알려 주므로 장식으로 숨김. */
export function PlatformIcon({ platform, className }: PlatformIconProps) {
  return (
    <img
      src={PLATFORM_ICON_SRC[platform]}
      alt=""
      aria-hidden
      className={cn("size-5 shrink-0", className)}
    />
  );
}
