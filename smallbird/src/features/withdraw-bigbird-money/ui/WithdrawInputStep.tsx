import { ChevronRight } from "lucide-react";

import { checkUploadFile, DOCUMENT_EXTENSIONS } from "@/entities/account";
import { BalanceCard } from "@/entities/bigbird-money";
import { FileUploadInput } from "@/shared/components/file-upload-input";
import { FormField } from "@/shared/components/form-field";
import { Inform } from "@/shared/components/inform";
import { OptionSelect } from "@/shared/components/option-select";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";

import { sanitizeAccountNumber } from "../lib/withdraw-form";

import type { WithdrawFieldError, WithdrawField } from "../lib/withdraw-error";
import type { WithdrawFormValues } from "../lib/withdraw-form";
import type { BankOption } from "@/entities/account";

const DOCUMENT_ACCEPT = DOCUMENT_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(",");

interface WithdrawInputStepProps {
  /** 보유 금액. 아직 불러오지 못했거나 실패했으면 undefined. */
  balanceAmount: number | undefined;
  banks: BankOption[];
  /** 은행 목록을 불러오지 못함. 은행 Select를 막고 안내와 다시 시도를 보임. */
  isBankListError: boolean;
  onRetryBankList: () => void;
  values: WithdrawFormValues;
  bankBook: File | null;
  errors: Partial<Record<WithdrawField, WithdrawFieldError>>;
  canNext: boolean;
  onChangeValues: (values: WithdrawFormValues) => void;
  /** 입력 오류를 지우려고 해당 칸을 고쳤음을 알림. */
  onEditField: (field: WithdrawField) => void;
  /** 파일을 골랐을 때. 형식·용량 위반이면 `error`와 함께 부르고 파일은 받지 않음. */
  onPickBankBook: (file: File | null, error: WithdrawFieldError | null) => void;
  onNext: () => void;
}

// 출금 1단계(Figma 11224:105091): 전액 출금 안내, 보유 금액, 출금 은행·계좌번호·예금주 명·통장 사본, 안내 4행, "다음".
export function WithdrawInputStep({
  balanceAmount,
  banks,
  isBankListError,
  onRetryBankList,
  values,
  bankBook,
  errors,
  canNext,
  onChangeValues,
  onEditField,
  onPickBankBook,
  onNext,
}: WithdrawInputStepProps) {
  const { t } = useTranslation("features/withdraw-bigbird-money");
  const { t: tCommon } = useTranslation();
  const bankBookLabel = t("field.bankBook.label");

  function errorText(field: WithdrawField) {
    const error = errors[field];
    return error ? t(`error.${error}`) : undefined;
  }

  function handlePickBankBook(file: File) {
    const rejection = checkUploadFile(file, DOCUMENT_EXTENSIONS);
    if (rejection === "extension") onPickBankBook(null, "fileExtension");
    else if (rejection === "size") onPickBankBook(null, "fileSize");
    else onPickBankBook(file, null);
  }

  return (
    <form
      noValidate
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        if (canNext) onNext();
      }}
    >
      <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
        <div className="flex flex-col gap-4 p-4 tablet:px-5 tablet:pt-4 tablet:pb-3">
          <Inform items={[{ id: "fullOnly", text: t("notice.fullOnly") }]} />
          <BalanceCard amount={balanceAmount} />
          <div className="flex flex-col gap-3">
            <FormField
              label={t("field.bank.label")}
              isRequired
              errorText={
                errorText("bank") ??
                (isBankListError ? t("error.bankList") : undefined)
              }
              disabled={isBankListError}
            >
              {(control) => (
                <OptionSelect
                  {...control}
                  value={values.bankIdx}
                  placeholder={t("field.bank.placeholder")}
                  options={banks.map((bank) => ({
                    value: String(bank.idx),
                    label: bank.name,
                  }))}
                  onChangeValue={(bankIdx) => {
                    onEditField("bank");
                    onChangeValues({ ...values, bankIdx });
                  }}
                />
              )}
            </FormField>
            {isBankListError && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="self-start"
                onClick={onRetryBankList}
              >
                {tCommon("action.retry")}
              </Button>
            )}
            <FormField
              label={t("field.accountNumber.label")}
              isRequired
              errorText={errorText("accountNumber")}
            >
              {(control) => (
                <Input
                  {...control}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={t("field.accountNumber.placeholder")}
                  value={values.accountNumber}
                  onChange={(event) => {
                    onEditField("accountNumber");
                    onChangeValues({
                      ...values,
                      accountNumber: sanitizeAccountNumber(event.target.value),
                    });
                  }}
                />
              )}
            </FormField>
            <FormField
              label={t("field.accountHolder.label")}
              isRequired
              errorText={errorText("accountHolder")}
            >
              {(control) => (
                <Input
                  {...control}
                  autoComplete="off"
                  placeholder={t("field.accountHolder.placeholder")}
                  value={values.accountHolder}
                  onChange={(event) => {
                    onEditField("accountHolder");
                    onChangeValues({
                      ...values,
                      accountHolder: event.target.value,
                    });
                  }}
                />
              )}
            </FormField>
            {/* 통장 사본 입력은 계정 설정 계좌 등록과 같은 컴포넌트·허용 형식·오류 문구를 임시로 씀(사용자 결정 2026-10-30). */}
            <FormField
              label={bankBookLabel}
              isRequired
              errorText={errorText("bankBook")}
            >
              {(control) => (
                <FileUploadInput
                  {...control}
                  fileName={bankBook?.name ?? ""}
                  placeholder={t("field.bankBook.placeholder")}
                  buttonLabel={t("field.bankBook.upload")}
                  buttonAriaLabel={t("field.bankBook.uploadFor", {
                    label: bankBookLabel,
                  })}
                  accept={DOCUMENT_ACCEPT}
                  onPickFile={handlePickBankBook}
                />
              )}
            </FormField>
          </div>
          <Inform
            hasLineTop
            items={[
              { id: "corporate", text: t("notice.corporate") },
              { id: "personal", text: t("notice.personal") },
              { id: "processing", text: t("notice.processing") },
              { id: "reflected", text: t("notice.reflected") },
            ]}
          />
        </div>
      </ScrollArea>
      <div className="p-4 tablet:p-5">
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={!canNext}
        >
          {t("next")}
          <ChevronRight />
        </Button>
      </div>
    </form>
  );
}
