import { toast } from "sonner";

import { Inform } from "@/shared/components/inform";
import { SectionCard } from "@/shared/components/section-card";
import { SwitchOption } from "@/shared/components/switch-field";
import { useTranslation } from "@/shared/i18n";

import { useNotificationConsent } from "../api/use-notification-consent";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CONSENT_KINDS,
} from "../model/constants";

// Figma 알림 설정(10061:201106 PC·10061:204621 TAB·10061:206815 MO): "알림톡 알림"·"푸시 알림" 카드(PC 2열, TAB·MO 세로) + 필수 알림 안내.
// 바꿀 때마다 바로 저장하는 흐름인데 API가 공개되기 전(스펙 §7 B-3)이라 "준비 중" 토스트만 띄우고 값은 그대로 둠(controlled 스위치).
export function NotificationConsentCards() {
  const { t } = useTranslation("features/notification-consent");
  const { t: tCommon } = useTranslation();
  const { consent } = useNotificationConsent();

  function handleChangeConsent() {
    toast(tCommon("status.comingSoon"));
  }

  return (
    <div className="flex flex-col gap-4 tablet:gap-6">
      <div className="flex flex-col gap-4 tablet:gap-6 desktop:grid desktop:grid-cols-2 desktop:gap-5">
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
                    onCheckedChange={handleChangeConsent}
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
