import { BalanceCard, useBigbirdMoneyBalance } from "@/entities/bigbird-money";
import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

import { useCampaignRegisterSlots } from "../../../model/slots-context";
import { PaymentCard } from "./PaymentCard";

const METHOD_ID = "payment-method-bigbird-money";

// 결제 수단(Figma 7555:334661 좌하): "빅버드 머니" 라디오(선택 고정 + "필수" 배지), 보유 빅버드 머니, 충전 영역.
// 결제 수단은 빅버드 머니 하나뿐이라 바꿀 수 없음. 보유 금액은 헤더 P와 같은 잔액 SWR 키를 읽음.
// 충전 영역은 페이지가 `chargeSlot`으로 채움(무통장 입금이라 입금이 확인돼야 잔액이 늘어남).
export function PaymentMethodCard({ className }: { className?: string }) {
  const { t } = useTranslation("features/register-campaign");
  const { balance } = useBigbirdMoneyBalance();
  const { chargeSlot } = useCampaignRegisterSlots();

  return (
    <PaymentCard title={t("payment.method.title")} className={className}>
      <RadioGroup
        value="bigbird-money"
        aria-label={t("payment.method.title")}
        className="mt-3"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="bigbird-money" id={METHOD_ID} />
          <Label htmlFor={METHOD_ID} className="gap-2">
            {t("payment.method.bigbirdMoney")}
            <Badge size="sm">{t("payment.method.required")}</Badge>
          </Label>
        </div>
      </RadioGroup>
      <BalanceCard titleAs="h3" amount={balance?.amount} />
      {chargeSlot}
    </PaymentCard>
  );
}
