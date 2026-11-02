import { ArrowLeft, X } from "lucide-react";

import { SubHeader } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import type { ReactNode } from "react";

export interface DetailRow {
  key: string;
  label: string;
  value: ReactNode;
}

interface DetailPanelProps {
  title: string;
  rows: DetailRow[];
  onClose: () => void;
  /** TAB·MO는 제목 앞에 뒤로 버튼도 둠(시안). */
  hasBackButton?: boolean;
  /** 하단 버튼 자리(거래명세서 받기). 없으면 그리지 않음. */
  footer?: ReactNode;
}

// 상세 보기 패널의 공통 틀(Figma 거래 상세 보기·사용 상세 보기): 제목 줄(뒤로·X) + 라벨·값 행 + 선택 하단 버튼.
// PC는 오른쪽 인라인 패널, TAB·MO는 본문을 대체하는 카드. 배치는 페이지가 정함.
export function DetailPanel({
  title,
  rows,
  onClose,
  hasBackButton = false,
  footer,
}: DetailPanelProps) {
  const { t: tCommon } = useTranslation();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <SubHeader
        title={
          <>
            {hasBackButton && (
              <Button
                type="button"
                variant="outline-foreground"
                size="icon-sm"
                aria-label={tCommon("action.back")}
                onClick={onClose}
              >
                <ArrowLeft />
              </Button>
            )}
            {title}
          </>
        }
        actions={
          <Button
            type="button"
            variant="ghost-foreground"
            size="icon"
            aria-label={tCommon("action.close")}
            onClick={onClose}
          >
            <X />
          </Button>
        }
      />
      <dl className="flex flex-1 flex-col overflow-y-auto p-4 tablet:p-5">
        {rows.map(({ key, label, value }) => (
          <div
            key={key}
            className="flex min-h-12 items-center justify-between gap-4 text-sm leading-5"
          >
            <dt className="shrink-0 font-medium text-foreground">{label}</dt>
            <dd className="flex min-w-0 justify-end text-right break-all text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {footer && <div className="p-4 tablet:p-5">{footer}</div>}
    </div>
  );
}
