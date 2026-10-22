import { useState } from "react";
import { toast } from "sonner";

import { SOCIAL_PROVIDERS } from "@/entities/account";
import { SectionCard } from "@/shared/components/section-card";
import { useTranslation } from "@/shared/i18n";
import { Switch } from "@/shared/ui/switch";

import { SocialIcon } from "./SocialIcon";
import { UnlinkSocialDialog } from "./UnlinkSocialDialog";

import type { SocialLinkViewModel, SocialProvider } from "@/entities/account";

interface SocialLinkCardProps {
  links: Record<SocialProvider, SocialLinkViewModel>;
  className?: string;
}

// Figma 간편 로그인 연동(10061:200931): 카드 안 5행(브랜드 아이콘 24 + 이름 | Switch sm), 행 높이 48.
// 연동·해제 API가 공개되기 전(스펙 §7 B-3, B-10)이라 켜기·해제 확인 모두 "준비 중" 토스트만 띄우고 스위치는 서버 값으로 둠(controlled).
// 켜기는 SNS 인증으로 이동하고, 끄기는 확인 알럿을 거치는 흐름은 스펙 §3.
export function SocialLinkCard({ links, className }: SocialLinkCardProps) {
  const { t } = useTranslation("features/link-social-account");
  const { t: tCommon } = useTranslation();
  const [unlinkTarget, setUnlinkTarget] = useState<SocialProvider | null>(null);

  function notifyComingSoon() {
    toast(tCommon("status.comingSoon"));
  }

  function handleChangeLink(provider: SocialProvider, next: boolean) {
    if (next) notifyComingSoon();
    else setUnlinkTarget(provider);
  }

  return (
    <SectionCard title={t("title")} className={className}>
      <ul className="flex flex-col p-3 tablet:p-5">
        {SOCIAL_PROVIDERS.map((provider) => {
          const name = t(`provider.${provider}`);
          return (
            <li
              key={provider}
              className="flex min-h-12 items-center gap-2 px-4"
            >
              <SocialIcon provider={provider} />
              <span className="min-w-0 flex-1 truncate text-sm leading-5 font-semibold text-foreground">
                {name}
              </span>
              <Switch
                size="sm"
                checked={links[provider].isLinked}
                aria-label={t("switchLabel", { provider: name })}
                onCheckedChange={(next) => handleChangeLink(provider, next)}
              />
            </li>
          );
        })}
      </ul>
      <UnlinkSocialDialog
        provider={unlinkTarget}
        onCancel={() => setUnlinkTarget(null)}
        onConfirm={() => {
          setUnlinkTarget(null);
          notifyComingSoon();
        }}
      />
    </SectionCard>
  );
}
