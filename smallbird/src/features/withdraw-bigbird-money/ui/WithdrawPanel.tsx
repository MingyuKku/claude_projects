import { ChevronLeft, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useBankList } from "@/entities/account";
import { useBigbirdMoneyBalance } from "@/entities/bigbird-money";
import { SubHeader } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { useRequestWithdraw } from "../api/use-request-withdraw";
import {
  EMPTY_WITHDRAW_FORM,
  isWithdrawFormComplete,
  toWithdrawBody,
} from "../lib/withdraw-form";
import { WithdrawConfirmStep } from "./WithdrawConfirmStep";
import { WithdrawInputStep } from "./WithdrawInputStep";

import type {
  WithdrawFailure,
  WithdrawField,
  WithdrawFieldError,
} from "../lib/withdraw-error";
import type { WithdrawFormValues } from "../lib/withdraw-form";
import type { WithdrawResult } from "../model/schema";

interface WithdrawPanelProps {
  onClose: () => void;
  /** TAB·MO는 제목 앞에 뒤로 버튼도 둠(시안). 2단계에서는 항상 보이고 1단계로 돌아감. */
  hasBackButton?: boolean;
  /** 출금 요청이 접수됐을 때. 완료 알럿과 내역 갱신은 호출하는 쪽이 함. */
  onWithdrawn: (result: WithdrawResult) => void;
}

// 빅버드 머니 출금 패널. 1단계(계좌 입력) → 2단계(확인·요청). 전액 출금만 가능해 금액 입력은 없고 보유 잔액을 그대로 요청함.
// PC는 오른쪽 인라인 패널, TAB·MO는 본문을 대체하는 카드. 배치는 페이지가 정함.
export function WithdrawPanel({
  onClose,
  hasBackButton = false,
  onWithdrawn,
}: WithdrawPanelProps) {
  const { t } = useTranslation("features/withdraw-bigbird-money");
  const { t: tCommon } = useTranslation();
  const { balance, mutate: refreshBalance } = useBigbirdMoneyBalance();
  const bankList = useBankList();
  const { banks } = bankList;
  const { isRequesting, request } = useRequestWithdraw();

  const [step, setStep] = useState<"input" | "confirm">("input");
  const [values, setValues] = useState<WithdrawFormValues>(EMPTY_WITHDRAW_FORM);
  const [bankBook, setBankBook] = useState<File | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<WithdrawField, WithdrawFieldError>>
  >({});

  // 잔액을 아직 모르면 요청할 금액이 없어 다음 단계로 못 감.
  const canNext =
    balance !== undefined && isWithdrawFormComplete(values, bankBook);
  const bankName =
    banks.find((bank) => String(bank.idx) === values.bankIdx)?.name ?? "";

  function setFieldError(field: WithdrawField, error?: WithdrawFieldError) {
    setErrors((prev) => {
      const next = { ...prev };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
  }

  function handlePickBankBook(
    file: File | null,
    error: WithdrawFieldError | null,
  ) {
    if (file) setBankBook(file);
    setFieldError("bankBook", error ?? undefined);
  }

  function handleFailure(failure: WithdrawFailure) {
    switch (failure.kind) {
      case "field":
        // 서버가 파일을 거부했으면 다시 고르게 비움.
        if (failure.field === "bankBook") setBankBook(null);
        setErrors({ [failure.field]: failure.error });
        setStep("input");
        return;
      case "zeroBalance":
        toast.error(t("toast.zeroBalance"));
        void refreshBalance();
        onClose();
        return;
      case "pending":
        toast.error(t("toast.pending"));
        onClose();
        return;
      case "balanceChanged":
        // 2단계에 머물며 새 금액을 보여 줌.
        toast.error(t("toast.balanceChanged"));
        void refreshBalance();
        return;
      case "unknown":
        toast.error(t("toast.failed"));
        return;
    }
  }

  async function handleSubmit() {
    if (balance === undefined || bankBook === null) return;
    const outcome = await request(
      toWithdrawBody(values, balance.amount),
      bankBook,
    );
    if (outcome === null) return;
    if (outcome.isSuccess) onWithdrawn(outcome.result);
    else handleFailure(outcome.failure);
  }

  const isConfirm = step === "confirm";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <SubHeader
        title={
          <>
            {(isConfirm || hasBackButton) && (
              <Button
                type="button"
                variant="outline-foreground"
                size="icon-sm"
                aria-label={tCommon("action.back")}
                disabled={isRequesting}
                onClick={isConfirm ? () => setStep("input") : onClose}
              >
                <ChevronLeft />
              </Button>
            )}
            {t("title")}
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
      {isConfirm && balance !== undefined && bankBook !== null ? (
        <WithdrawConfirmStep
          amount={balance.amount}
          bankName={bankName}
          accountNumber={values.accountNumber}
          accountHolder={values.accountHolder.trim()}
          bankBook={bankBook}
          isRequesting={isRequesting}
          onSubmit={() => void handleSubmit()}
        />
      ) : (
        <WithdrawInputStep
          balanceAmount={balance?.amount}
          banks={banks}
          isBankListError={bankList.isError}
          onRetryBankList={() => void bankList.mutate()}
          values={values}
          bankBook={bankBook}
          errors={errors}
          canNext={canNext}
          onChangeValues={setValues}
          onEditField={(field) => setFieldError(field)}
          onPickBankBook={handlePickBankBook}
          onNext={() => setStep("confirm")}
        />
      )}
    </div>
  );
}
