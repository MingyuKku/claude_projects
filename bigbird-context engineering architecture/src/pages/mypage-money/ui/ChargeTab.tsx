import { ChevronRight } from "lucide-react";

import { BalanceCard, useBigbirdMoneyBalance } from "@/entities/bigbird-money";
import {
  ChargeDetail,
  ChargeHistory,
  ChargeNotice,
  useChargeRecord,
} from "@/features/bigbird-money-history";
import { ChargePanel } from "@/features/charge-bigbird-money";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";

import { CHARGE_VIEWS } from "../model/tabs";
import { PanelFrame } from "./PanelFrame";

import type { ChargeView, MoneyLayout, MoneyPanel } from "../model/tabs";

interface ChargeTabProps {
  layout: MoneyLayout;
  /** MO 세그먼트("충전"·"상세 내역"). PC·TAB은 쓰지 않음. */
  view: ChargeView;
  onChangeView: (view: string) => void;
  panel: MoneyPanel | null;
  /** 거래 상세로 연 충전 내역(쿼리 `id`). */
  activeId: string | null;
  onOpenCharge: () => void;
  onOpenDetail: (id: string) => void;
  onClosePanel: () => void;
}

// 충전 내역 탭: 보유 머니·안내 카드 + 충전 상세 내역. MO는 둘을 세그먼트로 나눔.
// 충전·거래 상세는 PC에서 오른쪽 패널, TAB·MO에서 본문을 대체하는 카드(뒤로·X).
export function ChargeTab({
  layout,
  view,
  onChangeView,
  panel,
  activeId,
  onOpenCharge,
  onOpenDetail,
  onClosePanel,
}: ChargeTabProps) {
  const { t } = useTranslation("pages/mypage-money");
  const { balance } = useBigbirdMoneyBalance();
  const detailRecord = useChargeRecord(
    panel === "charge-detail" ? activeId : null,
  );
  const hasBackButton = layout !== "desktop";

  const sidePanel =
    panel === "charge" ? (
      <ChargePanel onClose={onClosePanel} hasBackButton={hasBackButton} />
    ) : detailRecord ? (
      <ChargeDetail
        record={detailRecord}
        onClose={onClosePanel}
        hasBackButton={hasBackButton}
      />
    ) : null;

  if (sidePanel && layout !== "desktop") {
    return <PanelFrame variant="screen">{sidePanel}</PanelFrame>;
  }

  const summary = (
    <div className="grid gap-4 tablet:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <BalanceCard
        amount={balance?.amount}
        action={
          <Button type="button" onClick={onOpenCharge}>
            {t("charge.action")}
            <ChevronRight />
          </Button>
        }
      />
      <ChargeNotice />
    </div>
  );
  const history = (
    <ChargeHistory
      activeId={detailRecord ? activeId : null}
      onClickDetail={onOpenDetail}
    />
  );

  if (layout === "mobile") {
    return (
      <Tabs value={view} onValueChange={onChangeView} className="gap-4">
        <TabsList className="w-full">
          {CHARGE_VIEWS.map((chargeView) => (
            <TabsTrigger key={chargeView} value={chargeView} className="flex-1">
              {t(`views.${chargeView}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="balance" className="flex flex-col gap-4">
          {summary}
        </TabsContent>
        <TabsContent value="history">{history}</TabsContent>
      </Tabs>
    );
  }

  return (
    <div className="flex items-start gap-5">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {summary}
        {history}
      </div>
      {sidePanel && <PanelFrame variant="aside">{sidePanel}</PanelFrame>}
    </div>
  );
}
