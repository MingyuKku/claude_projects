import { AppHeader } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import { CLIENT_GUIDE_URL } from "../model/navigation";
import { ShellHeaderActions } from "./ShellHeaderActions";

import type { SessionViewModel } from "@/entities/session";
import type { ReactNode } from "react";

interface FocusShellProps {
  session: SessionViewModel | null;
  /** 헤더 제목. 모바일에서도 보임(시안 `Header / Main / Mobile`). */
  title: string;
  /** PC·TAB에서 본문 왼쪽(LNB 자리)에 놓이는 사이드바. 모바일(768 미만)에서는 숨김. */
  sidebar?: ReactNode;
  onBack: () => void;
  children: ReactNode;
  className?: string;
  /** `<main>` 여백과 배경을 바꿈. 기본은 p-5. */
  mainClassName?: string;
}

// 한 작업에 집중하는 화면(캠페인 등록)용 셸. LNB 없이 뒤로가기 헤더 + 사이드바 자리 + 본문으로 구성함.
// 헤더 오른쪽(포인트·알림·프로필)은 AppShell과 같은 ShellHeaderActions를 씀.
export function FocusShell({
  session,
  title,
  sidebar,
  onBack,
  children,
  className,
  mainClassName,
}: FocusShellProps) {
  const { t } = useTranslation("widgets/app-shell");
  const { t: tCommon } = useTranslation();

  return (
    <div className={cn("flex h-dvh overflow-hidden bg-background", className)}>
      {/* 시안(Sidebar / Sub)은 사이드바가 LNB 자리에서 맨 위부터 전체 높이로 서고, 헤더는 그 오른쪽 열 위에만 있음. */}
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
            onClickGuide={() =>
              window.open(CLIENT_GUIDE_URL, "_blank", "noopener,noreferrer")
            }
          />
        </AppHeader>
        <main
          className={cn(
            "min-h-0 min-w-0 flex-1 overflow-auto",
            mainClassName ?? "p-5",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
