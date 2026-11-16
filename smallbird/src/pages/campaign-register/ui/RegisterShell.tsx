import { useOutletContext } from "react-router";

import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useGoBack } from "@/shared/lib";
import { FocusShell } from "@/widgets/app-shell";

import type { SessionViewModel } from "@/entities/session";
import type { ReactNode } from "react";

interface RegisterShellProps {
  sidebar?: ReactNode;
  children?: ReactNode;
}

// 등록 화면 셸: 헤더 "<" + "캠페인 등록". "<"는 브라우저 뒤로가기이고 앱 안 기록이 없으면 홈으로 감(스펙 §3 셸).
export function RegisterShell({ sidebar, children }: RegisterShellProps) {
  const { t } = useTranslation("pages/campaign-register");
  const session = useOutletContext<SessionViewModel>();
  const goBack = useGoBack(ROUTES.home);

  return (
    <>
      <title>{t("title")}</title>
      <FocusShell
        session={session}
        title={t("title")}
        sidebar={sidebar}
        onBack={goBack}
      >
        {children}
      </FocusShell>
    </>
  );
}
