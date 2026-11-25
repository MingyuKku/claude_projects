import { X } from "lucide-react";

import { SubHeader } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import type { ReactNode } from "react";

interface CreatorPanelProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// 매칭 드로어·전체 화면 패널의 공통 틀(제목 + 닫기). 본문과 하단 버튼은 children이 정함.
export function CreatorPanel({ title, onClose, children }: CreatorPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <SubHeader
        title={<h2 className="truncate">{title}</h2>}
        actions={
          <Button
            variant="ghost-foreground"
            size="icon"
            className="tablet:size-12 tablet:[&_svg:not([class*='size-'])]:size-6"
            aria-label={t("action.close")}
            onClick={onClose}
          >
            <X />
          </Button>
        }
      />
      {children}
    </div>
  );
}
