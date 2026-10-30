import { SkeletonSectionCard } from "@/shared/components/skeleton-presets";
import { Skeleton } from "@/shared/ui/skeleton";

import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CONSENT_KINDS,
} from "../model/constants";
import { NOTIFICATION_CARDS_CLASS_NAME } from "./class-names";

/** NotificationConsentCards 자리: 채널 카드마다 라벨·설명 | 스위치 행 */
export function NotificationConsentCardsSkeleton() {
  return (
    <div className={NOTIFICATION_CARDS_CLASS_NAME}>
      {NOTIFICATION_CHANNELS.map((channel) => (
        <SkeletonSectionCard key={channel} titleClassName="w-20">
          <div className="flex flex-col gap-3 p-4 tablet:gap-4 tablet:p-5">
            {NOTIFICATION_CONSENT_KINDS.map((kind) => (
              <div key={kind} className="flex items-start gap-4">
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            ))}
          </div>
        </SkeletonSectionCard>
      ))}
    </div>
  );
}
