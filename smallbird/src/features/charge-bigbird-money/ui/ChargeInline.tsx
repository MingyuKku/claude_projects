import { formatNumber, useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { useChargeForm } from "../model/use-charge-form";
import { ChargeAmountFields } from "./ChargeAmountFields";
import { ChargeTermsDialog } from "./ChargeTermsDialog";

interface ChargeInlineProps {
  /** 결제창을 마친 뒤 돌아올 화면(쿼리 없는 경로). 결제 서버가 뒤에 `?isPaid=…`를 이어 붙임. */
  returnPath: string;
}

// 다른 화면(캠페인 등록 결제)의 카드 안에 놓는 충전 입력: 금액·빠른 금액·안내·"충전하기"와 약관 팝업·결제 요청.
// 보유 머니 표시와 제목은 쓰는 화면이 그림. 무통장 입금이라 입금이 확인돼야 잔액이 늘어남.
export function ChargeInline({ returnPath }: ChargeInlineProps) {
  const { t } = useTranslation("features/charge-bigbird-money");
  const form = useChargeForm(returnPath);

  return (
    <form
      onSubmit={form.handleSubmit}
      noValidate
      className="flex flex-col gap-5"
    >
      <ChargeAmountFields form={form} />
      <Button type="submit" className="w-full" disabled={!form.canCharge}>
        {t("submit", { amount: formatNumber(form.amount ?? 0) })}
      </Button>
      <ChargeTermsDialog
        isOpen={form.isTermsOpen}
        isAgreeing={form.isRequesting}
        onClose={form.closeTerms}
        onAgree={() => void form.handleAgree()}
      />
    </form>
  );
}
