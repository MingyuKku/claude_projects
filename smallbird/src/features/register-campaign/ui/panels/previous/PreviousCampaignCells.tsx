import {
  getCampaignPlatformIcon,
  isCampaignPlatform,
  useCampaignLabels,
} from "@/entities/campaign";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { formatNumericDate } from "@/shared/i18n";
import { fromIsoDate } from "@/shared/lib";

import type { PreviousCampaign } from "@/entities/campaign";

/** 등록일(`yyyy-MM-dd HH:mm:ss`)의 날짜 부분을 보임. 읽을 수 없으면 원문 그대로. */
export function formatCreatedDate(createdDate: string) {
  const date = fromIsoDate(createdDate.slice(0, 10));
  return date ? formatNumericDate(date) : createdDate;
}

/** 플랫폼 로고(+ 이름). 모르는 코드는 로고 없이 서버 값을 그대로 보임. */
export function PlatformCell({
  platform,
  hasName,
}: {
  platform: PreviousCampaign["platform"];
  hasName: boolean;
}) {
  const labels = useCampaignLabels();
  if (platform === null) return null;

  return (
    <span className="flex items-center gap-2">
      {isCampaignPlatform(platform) && (
        <PlatformIcon
          platform={getCampaignPlatformIcon(platform)}
          className="size-6"
        />
      )}
      {hasName && <span>{labels.platform(platform)}</span>}
    </span>
  );
}
