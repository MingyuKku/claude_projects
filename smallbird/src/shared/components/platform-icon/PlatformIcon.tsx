import facebookIcon from "@/shared/assets/img/sns/facebook.svg";
import instagramIcon from "@/shared/assets/img/sns/instagram.svg";
import naverIcon from "@/shared/assets/img/sns/naver.svg";
import tiktokIcon from "@/shared/assets/img/sns/tiktok.svg";
import xIcon from "@/shared/assets/img/sns/x.svg";
import youtubeIcon from "@/shared/assets/img/sns/youtube.svg";
import { cn } from "@/shared/lib/utils";

/** 로고를 가진 플랫폼. 블로그는 `naver`의 로고를 씀. */
export type PlatformIconName =
  "instagram" | "naver" | "tiktok" | "facebook" | "youtube" | "x";

const PLATFORM_ICON_SRC: Record<PlatformIconName, string> = {
  instagram: instagramIcon,
  naver: naverIcon,
  tiktok: tiktokIcon,
  facebook: facebookIcon,
  youtube: youtubeIcon,
  x: xIcon,
};

interface PlatformIconProps {
  platform: PlatformIconName;
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
