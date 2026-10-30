import { useTranslation } from "@/shared/i18n";

/** 충전은 무통장 입금(`VBank`)만 받음. 그 밖의 값(옛 카드 충전 내역 등)은 서버 값을 그대로 보이고 없으면 "-". */
export function usePaymentMethodLabel() {
  const { t } = useTranslation("features/bigbird-money-history");

  return (payMethod: string) => {
    if (!payMethod) return "-";
    return payMethod === "VBank" ? t("charge.method.vbank") : payMethod;
  };
}
