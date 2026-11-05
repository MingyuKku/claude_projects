import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import {
  linkSocial,
  readFailureReason,
  SOCIAL_PROVIDERS,
  unlinkSocial,
} from "@/entities/account";
import { SectionCard } from "@/shared/components/section-card";
import { useTranslation } from "@/shared/i18n";
import { useDialogTarget, useOnPageRestore } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Switch } from "@/shared/ui/switch";

import { useNotifyLinkResult } from "../lib/use-notify-link-result";
import { SocialIcon } from "./SocialIcon";
import { UnlinkSocialDialog } from "./UnlinkSocialDialog";

import type {
  SocialLinkRequest,
  SocialLinkViewModel,
  SocialProvider,
} from "@/entities/account";

/** 해제하려는 플랫폼이 이미 연결돼 있지 않을 때 서버가 주는 `reason`(404). */
const SNS_NOT_LINKED_REASON = "SNS_NOT_LINKED";

/** 공급자 로그인을 시작함. 인가 코드를 바로 받거나, 화면을 옮겨 돌아온 뒤 이어 가거나, 취소됨(`SocialLinkRequest`). */
type LinkRequester = () => Promise<SocialLinkRequest>;

interface SocialLinkCardProps {
  links: Record<SocialProvider, SocialLinkViewModel>;
  /** 해제 뒤 서버가 돌려준 최신 연결 상태. 호출하는 쪽이 캐시를 바꿈. */
  onChangeLinks: (links: Record<SocialProvider, SocialLinkViewModel>) => void;
  /** SNS별 연결 시작. 공급자 로그인은 다른 feature(social-login)에 있어 페이지가 넘겨 줌. */
  linkRequesters: Record<SocialProvider, LinkRequester>;
  className?: string;
}

// Figma 간편 로그인 연동(10061:200931): 카드 안 4행(브랜드 아이콘 24 + 이름 | Switch sm), 행 높이 48. 시안의 페이스북 행은 그리지 않음.
// 해제는 `DELETE /v3/mypage/account/sns/{platform}`(2026-11-02 Stage)로 실제 호출하고, 응답의 최신 상태로 스위치를 바꿈(controlled).
// 연결(켜기)은 공급자 인가 코드를 받아 `POST`로 보냄. 켜기·끄기 흐름은 스펙 §3.
export function SocialLinkCard({
  links,
  onChangeLinks,
  linkRequesters,
  className,
}: SocialLinkCardProps) {
  const { t } = useTranslation("features/link-social-account");
  const notifyLinkResult = useNotifyLinkResult();
  const unlinkDialog = useDialogTarget<SocialProvider>();
  // 연결·해제 요청 중인 SNS. 그 스위치만 비활성으로 둠.
  const [busyProvider, setBusyProvider] = useState<SocialProvider | null>(null);
  // 공급자 화면에서 뒤로 가기로 돌아오면 복원된 화면에 "요청 중"이 남아 스위치가 계속 잠기므로 되돌림.
  useOnPageRestore(() => setBusyProvider(null));

  function handleChangeLink(provider: SocialProvider, next: boolean) {
    if (!next) {
      unlinkDialog.open(provider);
      return;
    }
    void handleLink(provider, linkRequesters[provider]);
  }

  async function handleLink(
    provider: SocialProvider,
    requestLink: LinkRequester,
  ) {
    setBusyProvider(provider);
    const [requestError, request] = await tryit(requestLink)();
    if (requestError || !request) {
      setBusyProvider(null);
      notifyLinkResult(provider, { status: "failed" });
      return;
    }
    // 사용자가 로그인 창을 닫은 경우는 안내 없이 끝냄.
    if (request.status === "cancelled") {
      setBusyProvider(null);
      return;
    }
    // 공급자 화면으로 전체 이동함. 돌아오는 화면이 연결을 이어 가므로 여기서는 스위치를 잠근 채 둠.
    if (request.status === "redirecting") return;
    const [error, nextLinks] = await tryit(linkSocial)(provider, {
      code: request.code,
      redirectUri: request.redirectUri,
    });
    setBusyProvider(null);
    if (nextLinks) {
      onChangeLinks(nextLinks);
      notifyLinkResult(provider, { status: "linked" });
      return;
    }
    notifyLinkResult(provider, {
      status: "failed",
      reason: readFailureReason(error),
    });
  }

  async function handleConfirmUnlink(provider: SocialProvider) {
    unlinkDialog.close();
    setBusyProvider(provider);
    const [error, nextLinks] = await tryit(unlinkSocial)(provider);
    setBusyProvider(null);
    if (nextLinks) {
      onChangeLinks(nextLinks);
      toast(t("unlink.toast.done", { provider: t(`provider.${provider}`) }));
      return;
    }
    // 다른 곳에서 이미 해제했으면 화면만 맞춤.
    if (readFailureReason(error) === SNS_NOT_LINKED_REASON) {
      onChangeLinks({ ...links, [provider]: { isLinked: false, email: null } });
      toast(t("unlink.toast.notLinked"));
      return;
    }
    toast.error(t("unlink.toast.failed"));
  }

  return (
    <SectionCard
      title={t("title")}
      className={cn("gap-3 tablet:gap-4", className)}
    >
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
                disabled={busyProvider === provider}
                aria-label={t("switchLabel", { provider: name })}
                onCheckedChange={(next) => handleChangeLink(provider, next)}
              />
            </li>
          );
        })}
      </ul>
      <UnlinkSocialDialog
        open={unlinkDialog.isOpen}
        provider={unlinkDialog.target}
        onCancel={unlinkDialog.close}
        onConfirm={(provider) => void handleConfirmUnlink(provider)}
      />
    </SectionCard>
  );
}
