import { tryit } from "radash";
import { toast } from "sonner";

import { EmptyState } from "@/shared/components/empty-state";
import { Inform } from "@/shared/components/inform";
import { SectionCard } from "@/shared/components/section-card";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";
import { SwitchOption } from "@/shared/components/switch-field";
import { formatDate, useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import {
  useNotificationConsent,
  useUpdateNotificationConsent,
} from "../api/use-notification-consent";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CONSENT_KINDS,
} from "../model/constants";
import { NOTIFICATION_CARDS_CLASS_NAME } from "./class-names";
import { NotificationConsentCardsSkeleton } from "./NotificationConsentCardsSkeleton";

import type {
  NotificationConsentChange,
  NotificationConsentViewModel,
} from "../model/types";

const CONSENT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

// Figma 알림 설정(10061:201106 PC·10061:204621 TAB·10061:206815 MO): "알림톡 알림"·"푸시 알림" 카드(PC 2열, TAB·MO 세로) + 필수 알림 안내.
// 스위치를 바꿀 때마다 바로 저장함. 광고성 정보 수신 동의·철회 사실은 이 토스트로만 알리고, 응답에 일자가 없어
// v2처럼 바꾼 날(오늘)을 씀.
export function NotificationConsentCards() {
  const { t } = useTranslation("features/notification-consent");
  const { t: tCommon } = useTranslation();
  const { consent, isLoading, isError, mutate } = useNotificationConsent();
  const { updateConsent } = useUpdateNotificationConsent();

  async function handleChangeConsent(
    current: NotificationConsentViewModel,
    change: NotificationConsentChange,
  ) {
    const [error] = await tryit(updateConsent)(current, change);
    if (error) {
      toast.error(tCommon("feedback.saveFailed"));
      return;
    }
    const date = formatDate(new Date(), CONSENT_DATE_FORMAT);
    toast(t(change.isAgreed ? "toast.agreed" : "toast.withdrawn", { date }));
  }

  if (isLoading) {
    return (
      <SkeletonGroup>
        <NotificationConsentCardsSkeleton />
      </SkeletonGroup>
    );
  }

  if (isError || !consent) {
    return (
      <EmptyState
        type="alarm"
        title={tCommon("error.unexpected")}
        className="py-20"
        action={
          <Button variant="outline" onClick={() => void mutate()}>
            {tCommon("action.retry")}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 tablet:gap-6">
      <div className={NOTIFICATION_CARDS_CLASS_NAME}>
        {NOTIFICATION_CHANNELS.map((channel) => (
          <SectionCard
            key={channel}
            title={t(`${channel}.title`)}
            className="gap-3 tablet:gap-4"
            cardClassName="flex-none"
          >
            <ul className="flex flex-col gap-3 p-4 tablet:gap-4 tablet:p-5">
              {NOTIFICATION_CONSENT_KINDS.map((kind) => (
                <li key={kind}>
                  <SwitchOption
                    indicatorPosition="right"
                    className="flex w-full items-start gap-4"
                    label={t(`${kind}.label`)}
                    description={t(`${channel}.${kind}.description`)}
                    checked={consent[channel][kind]}
                    onCheckedChange={(isAgreed) =>
                      void handleChangeConsent(consent, {
                        channel,
                        kind,
                        isAgreed,
                      })
                    }
                  />
                </li>
              ))}
            </ul>
          </SectionCard>
        ))}
      </div>
      <Inform
        variant="filled"
        className="p-4 tablet:p-5"
        items={[{ id: "required", text: t("notice") }]}
      />
    </div>
  );
}
