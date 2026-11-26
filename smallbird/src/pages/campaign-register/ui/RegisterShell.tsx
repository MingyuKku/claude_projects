import { useNavigate, useOutletContext } from "react-router";

import {
  CampaignDemoTag,
  useCampaignStatusReturnStore,
} from "@/entities/campaign";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { FocusShell } from "@/widgets/app-shell";

import type { SessionViewModel } from "@/entities/session";
import type { ReactNode } from "react";

interface RegisterShellProps {
  isDemo?: boolean;
  sidebar?: ReactNode;
  children?: ReactNode;
}

// 등록 화면 셸: 헤더 "<" + "캠페인 등록". "<"는 늘 캠페인 현황으로 가고(마지막에 보던 탭·검색·쪽 유지), 브라우저 뒤로가기는 기록을 따름(스펙 §3 셸).
export function RegisterShell({
  isDemo = false,
  sidebar,
  children,
}: RegisterShellProps) {
  const { t } = useTranslation("pages/campaign-register");
  const session = useOutletContext<SessionViewModel>();
  const navigate = useNavigate();
  const statusSearch = useCampaignStatusReturnStore((state) => state.search);

  return (
    <>
      <title>{t("title")}</title>
      <FocusShell
        session={session}
        title={t("title")}
        titleBadge={isDemo ? <CampaignDemoTag /> : undefined}
        sidebar={sidebar}
        onBack={() => void navigate(`${ROUTES.campaign}${statusSearch}`)}
      >
        {children}
      </FocusShell>
    </>
  );
}
