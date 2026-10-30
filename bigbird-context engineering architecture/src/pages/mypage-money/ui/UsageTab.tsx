import {
  UsageDetail,
  UsageHistory,
  useUsageRecord,
} from "@/features/bigbird-money-history";

import { PanelFrame } from "./PanelFrame";

import type { MoneyLayout, MoneyPanel } from "../model/tabs";

interface UsageTabProps {
  layout: MoneyLayout;
  panel: MoneyPanel | null;
  /** 상세 보기로 연 사용 내역(쿼리 `id`). */
  activeId: string | null;
  onOpenDetail: (id: string) => void;
  onClosePanel: () => void;
}

// 사용 내역 탭. 상세 보기는 PC에서 오른쪽 패널, TAB에서 본문을 대체하는 카드. MO는 카드에 모든 정보가 있어 상세 보기가 없음.
export function UsageTab({
  layout,
  panel,
  activeId,
  onOpenDetail,
  onClosePanel,
}: UsageTabProps) {
  const record = useUsageRecord(panel === "usage-detail" ? activeId : null);
  const detail =
    record && layout !== "mobile" ? (
      <UsageDetail
        record={record}
        onClose={onClosePanel}
        hasBackButton={layout === "tablet"}
      />
    ) : null;

  if (detail && layout === "tablet") {
    return <PanelFrame variant="screen">{detail}</PanelFrame>;
  }

  return (
    <div className="flex items-start gap-5">
      <div className="min-w-0 flex-1">
        <UsageHistory
          activeId={detail ? activeId : null}
          onClickDetail={onOpenDetail}
        />
      </div>
      {detail && <PanelFrame variant="aside">{detail}</PanelFrame>}
    </div>
  );
}
