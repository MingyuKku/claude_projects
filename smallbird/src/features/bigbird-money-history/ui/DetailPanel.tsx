import { ChevronLeft, X } from "lucide-react";

import { SubHeader } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

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
                <ChevronLeft />
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
            className="tablet:size-12 tablet:[&_svg:not([class*='size-'])]:size-6"
            aria-label={tCommon("action.close")}
            onClick={onClose}
          >
            <X />
          </Button>
        }
      />
      <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
        <dl className="flex flex-col tablet:px-5 tablet:pt-4 tablet:pb-3">
          {rows.map(({ key, label, value }) => (
            <div
              key={key}
              className="flex min-h-12 items-center px-4 py-1.5 text-sm leading-5"
            >
              {/* PC·TAB 시안은 라벨·값 칸이 반씩이라 긴 값(캠페인 명)은 값 칸 안에서 줄바꿈함. MO는 본문 여백 없이 행 여백 16, 라벨 길이만큼. */}
              <dt className="shrink-0 pr-4 font-semibold text-foreground tablet:w-1/2">
                {label}
              </dt>
              <dd className="flex min-w-0 flex-1 justify-end text-right wrap-anywhere text-foreground ko:break-keep">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </ScrollArea>
      {footer && <div className="p-4 tablet:p-5">{footer}</div>}
    </div>
  );
}
