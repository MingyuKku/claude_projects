import { ChevronLeft, XIcon } from "lucide-react";

import { SubHeader } from "@/shared/components/app-header";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import type { ReactNode } from "react";

interface PanelLayoutProps {
  title: string;
  /** 넘기면 제목 앞에 "<"(한 단계 위 하위 화면으로). */
  onBack?: () => void;
  onClose: () => void;
  /** 본문이 남은 높이를 채우고 안쪽에서 따로 스크롤함. */
  isBodyFixed?: boolean;
  /** 하단 고정 버튼 영역. */
  footer?: ReactNode;
  children: ReactNode;
}

// 하위 화면 틀(Figma `Header / Sub` + 본문 + 하단 버튼 영역). PC 드로어와 TAB·MO 서브 화면이 함께 씀.
export function PanelLayout({
  title,
  onBack,
  onClose,
  isBodyFixed = false,
  footer,
  children,
}: PanelLayoutProps) {
  const { t: tCommon } = useTranslation();

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <SubHeader
        title={
          <span className="flex min-w-0 items-center gap-3">
            {onBack && (
              <Button
                variant="outline-foreground"
                size="icon-sm"
                aria-label={tCommon("action.back")}
                onClick={onBack}
              >
                <ChevronLeft />
              </Button>
            )}
            <h2 className="truncate">{title}</h2>
          </span>
        }
        actions={
          <Button
            variant="ghost-muted"
            size="icon"
            aria-label={tCommon("action.close")}
            className="text-foreground tablet:size-12"
            onClick={onClose}
          >
            <XIcon className="size-4 tablet:size-6" />
          </Button>
        }
      />
      {isBodyFixed ? (
        <div className="min-h-0 flex-1">{children}</div>
      ) : (
        <ScrollPanel className="flex-1" contentClassName="flex flex-col">
          {children}
        </ScrollPanel>
      )}
      {footer && <div className="shrink-0 ds-p-5">{footer}</div>}
    </div>
  );
}
