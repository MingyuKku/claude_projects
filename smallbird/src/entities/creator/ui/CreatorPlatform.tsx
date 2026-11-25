import { PlatformIcon } from "@/shared/components/platform-icon";
import { EMPTY_VALUE } from "@/shared/lib";

import { usePlatformName } from "../lib/use-platform-name";

import type { MatchingPlatform } from "../model/types";

interface CreatorPlatformProps {
  /** 옵션 목록을 아직 못 받았거나 모르는 platformIdx면 없음. */
  platform: MatchingPlatform | undefined;
}

// 화면 읽기용 이름이 스크롤 영역 밖으로 빠져 문서 높이를 늘리지 않게 relative로 가둠.
// 로고가 있는 플랫폼은 로고만 보이고 이름은 화면 읽기용. 로고가 없는 플랫폼은 서버 이름을 그대로 보임.
export function CreatorPlatform({ platform }: CreatorPlatformProps) {
  const getPlatformName = usePlatformName();

  if (!platform) return EMPTY_VALUE;
  if (!platform.code) return platform.name;

  return (
    <span className="relative inline-flex">
      <PlatformIcon platform={platform.code} className="size-6" />
      <span className="sr-only">{getPlatformName(platform)}</span>
    </span>
  );
}
