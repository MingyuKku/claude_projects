import { useState } from "react";
import { toast } from "sonner";

import { checkUploadFile, DOCUMENT_EXTENSIONS } from "@/entities/account";
import { FileUploadInput } from "@/shared/components/file-upload-input";
import { FormRow } from "@/shared/components/form-field";
import { Inform } from "@/shared/components/inform";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

import { useCompanyCategories } from "../api/use-company-categories";
import {
  EMPTY_FILES,
  isCompanyFormComplete,
  toCompanyFormValues,
} from "../lib/company-form";
import { saveCompanyInfo } from "../lib/save-company-info";
import { UPLOAD_FORMAT_REASON } from "../model/constants";
import { CompanyCategorySelect } from "./CompanyCategorySelect";

import type { CompanyFormFiles, CompanyFormValues } from "../lib/company-form";
import type { CompanySaveStep } from "../lib/save-company-info";
import type { CompanyInfoViewModel, UploadRejection } from "@/entities/account";
import type { ChangeEvent, FormEvent } from "react";

const DOCUMENT_ACCEPT = DOCUMENT_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(",");

type FileField = keyof CompanyFormFiles;
type TextField = Exclude<keyof CompanyFormValues, "categoryIdx">;

interface CompanyInfoFormProps {
  /** 등록된 회사정보. 아직 없으면 null(첫 저장은 POST). */
  company: CompanyInfoViewModel | null;
  /** 회사정보가 서버에 반영된 뒤 호출. 화면이 정보를 다시 읽음. */
  onSaved: () => void;
}

// Figma 회사정보(6925:64463): 라벨 왼쪽·입력 오른쪽 표(MO는 위·아래), 하단 취소·저장, 카드 아래 이용 안내.
export function CompanyInfoForm({ company, onSaved }: CompanyInfoFormProps) {
  const { t } = useTranslation("features/edit-company-info");
  const { t: tCommon } = useTranslation();
  const { categories } = useCompanyCategories();

  const [values, setValues] = useState(() => toCompanyFormValues(company));
  const [files, setFiles] = useState<CompanyFormFiles>(EMPTY_FILES);
  const [fileErrors, setFileErrors] = useState<
    Partial<Record<FileField, UploadRejection>>
  >({});
  // 저장 직후 조회가 갱신되기 전에도 방금 올린 서류의 이름을 보이도록 기억해 둠.
  const [uploadedNames, setUploadedNames] = useState<
    Partial<Record<FileField, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  const canSave = isCompanyFormComplete(values, files, company) && !isSaving;

  function handleChangeText(field: TextField) {
    return (event: ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function handlePickFile(field: FileField) {
    return (file: File) => {
      const rejection = checkUploadFile(file, DOCUMENT_EXTENSIONS);
      setFileErrors((prev) => ({ ...prev, [field]: rejection ?? undefined }));
      if (!rejection) setFiles((prev) => ({ ...prev, [field]: file }));
    };
  }

  function handleClickCancel() {
    setValues(toCompanyFormValues(company));
    setFiles(EMPTY_FILES);
    setFileErrors({});
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    setIsSaving(true);
    const result = await saveCompanyInfo({
      isRegistered: company !== null,
      values,
      files,
    });
    setIsSaving(false);

    if (result.hasSavedInfo) onSaved();
    rememberUploadedNames(result.failedStep);
    if (!result.failedStep) {
      setFiles(EMPTY_FILES);
      setFileErrors({});
      toast(tCommon("feedback.saved"));
      return;
    }

    toast.error(tCommon("feedback.saveFailed"));
    const { failedStep } = result;
    if (failedStep === "info") return;
    // 사업자 등록증은 올라갔고 통신판매업 신고증만 실패한 경우, 올라간 파일은 다시 올리지 않음.
    if (failedStep === "mailorderReport") {
      setFiles((prev) => ({ ...prev, businessRegistration: null }));
    }
    if (result.reason === UPLOAD_FORMAT_REASON) {
      setFileErrors((prev) => ({ ...prev, [failedStep]: "extension" }));
    }
  }

  // 저장 순서(사업자 등록증 → 통신판매업 신고증)상 실패한 단계 앞의 파일만 올라갔음.
  function rememberUploadedNames(failedStep: CompanySaveStep | null) {
    // 회사정보 저장이 실패하면 서류는 올리지 않았음.
    if (failedStep === "info") return;
    const uploaded: Partial<Record<FileField, string>> = {};
    if (files.businessRegistration && failedStep !== "businessRegistration") {
      uploaded.businessRegistration = files.businessRegistration.name;
    }
    if (files.mailorderReport && failedStep === null) {
      uploaded.mailorderReport = files.mailorderReport.name;
    }
    setUploadedNames((prev) => ({ ...prev, ...uploaded }));
  }

  // 고른 파일 → 방금 올린 파일 → 서버가 준 등록 파일명 → 이름 없이 등록만 된 경우 "등록됨".
  function getFileName(
    field: FileField,
    registered: { exists: boolean; name: string | null },
  ) {
    const name = files[field]?.name ?? uploadedNames[field] ?? registered.name;
    if (name) return name;
    return registered.exists ? t("file.registered") : "";
  }

  function getFileError(field: FileField) {
    const rejection = fileErrors[field];
    return rejection ? t(`file.error.${rejection}`) : undefined;
  }

  const businessFileLabel = t("form.businessFile");
  const mailorderFileLabel = t("form.mailorderFile");

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        {/* PC·TAB 시안에는 제목이 없고 MO에만 있어 태블릿 이상에서는 화면 낭독용으로만 둠. */}
        <h2 className="text-base leading-none font-semibold text-foreground tablet:sr-only">
          {t("title")}
        </h2>
        <Card>
          <div className="flex flex-col p-3 pb-3.5 tablet:p-5 tablet:pb-3">
            <div className="flex flex-col gap-2 p-3.5 tablet:gap-0 tablet:p-0">
              <FormRow label={t("form.companyName")} isRequired>
                {(control) => (
                  <Input
                    {...control}
                    value={values.companyName}
                    onChange={handleChangeText("companyName")}
                  />
                )}
              </FormRow>
              <FormRow label={t("form.contact")} isRequired>
                {(control) => (
                  <Input
                    {...control}
                    type="tel"
                    value={values.contact}
                    onChange={handleChangeText("contact")}
                  />
                )}
              </FormRow>
              <FormRow label={t("form.businessNumber")} isRequired>
                {(control) => (
                  <Input
                    {...control}
                    value={values.businessNumber}
                    onChange={handleChangeText("businessNumber")}
                  />
                )}
              </FormRow>
              <FormRow
                label={businessFileLabel}
                isRequired
                errorText={getFileError("businessRegistration")}
              >
                {(control) => (
                  <FileUploadInput
                    {...control}
                    fileName={getFileName("businessRegistration", {
                      exists: Boolean(company?.hasBusinessRegistrationFile),
                      name: company?.businessRegistrationFileName ?? null,
                    })}
                    buttonLabel={t("file.upload")}
                    buttonAriaLabel={t("file.uploadFor", {
                      label: businessFileLabel,
                    })}
                    accept={DOCUMENT_ACCEPT}
                    onPickFile={handlePickFile("businessRegistration")}
                  />
                )}
              </FormRow>
              <FormRow label={t("form.mailorderNumber")} isRequired>
                {(control) => (
                  <Input
                    {...control}
                    value={values.mailorderNumber}
                    onChange={handleChangeText("mailorderNumber")}
                  />
                )}
              </FormRow>
              <FormRow
                label={mailorderFileLabel}
                isRequired
                errorText={getFileError("mailorderReport")}
              >
                {(control) => (
                  <FileUploadInput
                    {...control}
                    fileName={getFileName("mailorderReport", {
                      exists: Boolean(company?.hasMailorderFile),
                      name: company?.mailorderFileName ?? null,
                    })}
                    buttonLabel={t("file.upload")}
                    buttonAriaLabel={t("file.uploadFor", {
                      label: mailorderFileLabel,
                    })}
                    accept={DOCUMENT_ACCEPT}
                    onPickFile={handlePickFile("mailorderReport")}
                  />
                )}
              </FormRow>
              <FormRow label={t("form.category")}>
                {(control) => (
                  <CompanyCategorySelect
                    {...control}
                    value={values.categoryIdx}
                    categories={categories}
                    savedName={company?.categoryName ?? null}
                    onChangeValue={(categoryIdx) =>
                      setValues((prev) => ({ ...prev, categoryIdx }))
                    }
                  />
                )}
              </FormRow>
              <FormRow label={t("form.url")}>
                {(control) => (
                  <Input
                    {...control}
                    type="url"
                    value={values.companyUrl}
                    onChange={handleChangeText("companyUrl")}
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
      <Inform
        variant="filled"
        items={[
          { id: "required", text: t("inform.required") },
          { id: "file", text: t("inform.file") },
        ]}
      />
    </form>
  );
}
