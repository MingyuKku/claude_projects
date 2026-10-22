import { toast } from "sonner";

import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";

import {
  useCampaignAssignments,
  useSubAccountPermissions,
} from "../api/use-sub-account-permissions";
import { CampaignAssignmentCards } from "./CampaignAssignmentCards";
import { CampaignAssignmentTable } from "./CampaignAssignmentTable";
import { PermissionTable } from "./PermissionTable";

import type { ReactNode } from "react";

const TABLET_QUERY = "(min-width: 768px)";
const DESKTOP_QUERY = "(min-width: 1440px)";

// Figma 권한 부여(10061:201481 PC·10061:204481 TAB·10061:206662 MO): "Sub ID 권한부여" → "Sub ID 캠페인 할당" 두 섹션.
// 섹션 간격 PC·TAB 24, MO 20. 저장 버튼 없이 스위치를 바꿀 때마다 바로 저장하는 흐름인데, 저장 API가 공개되기 전(스펙 §7 B-3)이라
// 지금은 "준비 중" 토스트만 띄우고 값은 그대로 둠(controlled 스위치).
// 표·카드가 자체 테두리를 가져 Section(Card) 대신 제목 + 본문으로 그림.
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <h2 className="text-base leading-none font-semibold text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SubAccountPermissionSections() {
  const { t } = useTranslation("features/manage-sub-accounts");
  const { t: tCommon } = useTranslation();
  const isTabletUp = useMediaQuery(TABLET_QUERY);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const { permissions } = useSubAccountPermissions();
  const { campaigns } = useCampaignAssignments();

  function handleChangeBlocked() {
    toast(tCommon("status.comingSoon"));
  }

  return (
    <div className="flex flex-col gap-5 tablet:gap-6">
      <Section title={t("access.permission.title")}>
        <PermissionTable
          permissions={permissions}
          onChangePermission={handleChangeBlocked}
        />
      </Section>
      {/* 할당할 캠페인이 없으면 섹션째 숨김(사용자 결정). */}
      {campaigns.length > 0 && (
        <Section title={t("access.campaign.title")}>
          {isTabletUp ? (
            <CampaignAssignmentTable
              campaigns={campaigns}
              isStatusHeaderLong={isDesktop}
              onChangeAssignment={handleChangeBlocked}
            />
          ) : (
            <CampaignAssignmentCards
              campaigns={campaigns}
              onChangeAssignment={handleChangeBlocked}
            />
          )}
        </Section>
      )}
    </div>
  );
}
