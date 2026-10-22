import { useState } from "react";
import { toast } from "sonner";

import { checkUploadFile, DOCUMENT_EXTENSIONS } from "@/entities/account";
import { FileUploadInput } from "@/shared/components/file-upload-input";
import { FormRow } from "@/shared/components/form-field";
import { OptionSelect } from "@/shared/components/option-select";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

import { isBankFormComplete, toBankFormValues } from "../lib/bank-form";
import { saveBankAccountWithBankBook } from "../lib/save-bank-account";
import { UPLOAD_FORMAT_REASON } from "../model/constants";

import type { BankFormValues } from "../lib/bank-form";
import type { BankAccountViewModel } from "../model/schema";
import type { UploadRejection } from "@/entities/account";
import type { ChangeEvent, FormEvent } from "react";

const DOCUMENT_ACCEPT = DOCUMENT_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(",");

interface BankAccountFormProps {
  /** 등록된 계좌. 아직 없으면 null. */
  account: BankAccountViewModel | null;
  banks: { idx: number; name: string }[];
  /** 계좌 정보가 서버에 반영된 뒤 호출. 화면이 정보를 다시 읽음. */
  onSaved: () => void;
}

// Figma 계좌정보(6925:68046): 라벨 왼쪽·입력 오른쪽 표(MO는 위·아래), 하단 취소·저장. 은행은 시안의 입력칸 대신 Select(사용자 확인).
export function BankAccountForm({
  account,
  banks,
  onSaved,
}: BankAccountFormProps) {
  const { t } = useTranslation("features/edit-bank-account");
  const { t: tCommon } = useTranslation();

  const [values, setValues] = useState(() => toBankFormValues(account, banks));
  const [bankBook, setBankBook] = useState<File | null>(null);
  const [fileError, setFileError] = useState<UploadRejection | null>(null);
  // 서버는 등록된 통장 사본의 이름을 조회 응답으로 주지 않아, 이번 화면에서 올린 파일은 이름을 기억해 보여 줌.
  const [uploadedName, setUploadedName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const canSave = isBankFormComplete(values, bankBook, account) && !isSaving;
  const bankBookLabel = t("form.bankBook");

  function handleChangeText(field: Exclude<keyof BankFormValues, "bankIdx">) {
    return (event: ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function handlePickBankBook(file: File) {
    const rejection = checkUploadFile(file, DOCUMENT_EXTENSIONS);
    setFileError(rejection);
    if (!rejection) setBankBook(file);
  }

  function handleClickCancel() {
    setValues(toBankFormValues(account, banks));
    setBankBook(null);
    setFileError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    setIsSaving(true);
    const result = await saveBankAccountWithBankBook({ values, bankBook });
    setIsSaving(false);

    if (result.hasSavedInfo) onSaved();
    if (!result.failure) {
      if (bankBook) setUploadedName(bankBook.name);
      setBankBook(null);
      setFileError(null);
      toast(tCommon("feedback.saved"));
      return;
    }

    if (result.failure === "denied") toast.error(t("toast.denied"));
    else toast.error(tCommon("feedback.saveFailed"));
    if (
      result.failure === "bankBook" &&
      result.reason === UPLOAD_FORMAT_REASON
    ) {
      setFileError("extension");
    }
  }

  const bankFileName =
    bankBook?.name ??
    (uploadedName || (account?.hasBankBookFile ? t("file.registered") : ""));

  return (
    <form onSubmit={handleSubmit} noValidate>
      <section className="flex flex-col gap-4">
        {/* PC·TAB 시안에는 제목이 없고 MO에만 있어 태블릿 이상에서는 화면 낭독용으로만 둠. */}
        <h2 className="text-base leading-none font-semibold text-foreground tablet:sr-only">
          {t("title")}
        </h2>
        <Card>
          <div className="flex flex-col p-3 pb-3.5 tablet:p-5 tablet:pb-3">
            <div className="flex flex-col gap-2 p-3.5 tablet:gap-0 tablet:p-0">
              <FormRow label={t("form.bank")} isRequired>
                {(control) => (
                  <OptionSelect
                    {...control}
                    value={values.bankIdx}
                    options={banks.map((bank) => ({
                      value: String(bank.idx),
                      label: bank.name,
                    }))}
                    onChangeValue={(bankIdx) =>
                      setValues((prev) => ({ ...prev, bankIdx }))
                    }
                  />
                )}
              </FormRow>
              <FormRow label={t("form.accountNumber")} isRequired>
                {(control) => (
                  <Input
                    {...control}
                    inputMode="numeric"
                    value={values.accountNumber}
                    onChange={handleChangeText("accountNumber")}
                  />
                )}
              </FormRow>
              <FormRow label={t("form.accountHolder")} isRequired>
                {(control) => (
                  <Input
                    {...control}
                    value={values.accountHolder}
                    onChange={handleChangeText("accountHolder")}
                  />
                )}
              </FormRow>
              <FormRow
                label={bankBookLabel}
                isRequired
                errorText={fileError ? t(`file.error.${fileError}`) : undefined}
              >
                {(control) => (
                  <FileUploadInput
                    {...control}
                    fileName={bankFileName}
                    buttonLabel={t("file.upload")}
                    buttonAriaLabel={t("file.uploadFor", {
                      label: bankBookLabel,
                    })}
                    accept={DOCUMENT_ACCEPT}
                    onPickFile={handlePickBankBook}
                  />
                )}
              </FormRow>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-3 py-4 tablet:p-5">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={handleClickCancel}
            >
              {tCommon("action.cancel")}
            </Button>
            <Button type="submit" disabled={!canSave}>
              {tCommon("action.save")}
            </Button>
          </div>
        </Card>
      </section>
    </form>
  );
}
