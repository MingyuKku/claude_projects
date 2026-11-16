import { AppHeader } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import { CLIENT_GUIDE_URL } from "../model/navigation";
import { ShellHeaderActions } from "./ShellHeaderActions";

import type { SessionViewModel } from "@/entities/session";
import type { ReactNode } from "react";

interface FocusShellProps {
  session: SessionViewModel | null;
  /** 헤더 제목. 모바일 헤더에도 보임(시안 `Header / Main / Mobile`). */
  title: string;
  /** PC·TAB에서 LNB 자리(222px, 맨 위부터 전체 높이)에 놓이는 사이드바. 모바일(768 미만)에서는 숨김. */
  sidebar?: ReactNode;
  onBack: () => void;
  children: ReactNode;
  className?: string;
}

// 한 작업에 집중하는 화면(캠페인 등록·등록 내역)의 셸. LNB 대신 사이드바 자리를 두고, 헤더는 "<" + 제목 + 오른쪽 묶음.
// AppShell에 모드를 더하지 않고 따로 둠(스펙 register §3 셸). 본문 스크롤·하단 고정 바는 화면이 정함.
export function FocusShell({
  session,
  title,
  sidebar,
  onBack,
  children,
  className,
}: FocusShellProps) {
  const { t } = useTranslation("widgets/app-shell");
  const { t: tCommon } = useTranslation();

  function handleClickGuide() {
    window.open(CLIENT_GUIDE_URL, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={cn("flex h-dvh overflow-hidden bg-background", className)}>
      {sidebar && (
        <aside className="hidden w-55.5 shrink-0 tablet:block">{sidebar}</aside>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title={title}
          isTitleVisibleOnMobile
          menuLabel={t("menu.open")}
          backLabel={tCommon("action.back")}
          onClickBack={onBack}
        >
          <ShellHeaderActions
            session={session}
            onClickGuide={handleClickGuide}
          />
        </AppHeader>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
