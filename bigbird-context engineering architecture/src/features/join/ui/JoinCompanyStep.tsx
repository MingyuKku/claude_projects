import { useState } from "react";
import { useNavigate } from "react-router";

import { digitsOnly, isValidCompanyUrl } from "@/entities/account";
import {
  AuthButton,
  AuthHeader,
  AuthInput,
  AuthText,
} from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";

import {
  uploadCompanyRegistration,
  uploadMailorderBusiness,
} from "../api/join-api";
import {
  canProceedFromCompany,
  resolveInputState,
  resolveMessageClass,
} from "../lib/gating";
import { useEmailDuplicateCheck } from "../lib/use-email-duplicate-check";
import {
  BUSINESS_NUMBER_DIGITS,
  CONTACT_MAX_DIGITS,
  JOIN_STEP_PROGRESS,
} from "../model/constants";
import { useJoinStore } from "../model/join-store-context";
import { CategorySelect } from "./CategorySelect";
import { FileUploadField } from "./FileUploadField";
import { MailorderNumberField } from "./MailorderNumberField";

import type { ChangeEvent } from "react";

export function JoinCompanyStep() {
  const { t } = useTranslation("features/join");
  const account = useJoinStore((state) => state.account);
  const company = useJoinStore((state) => state.company);
  const patchAccount = useJoinStore((state) => state.patchAccount);
  const patchCompany = useJoinStore((state) => state.patchCompany);
  const setStage = useJoinStore((state) => state.setStage);
  const navigate = useNavigate();
  const { emailError, changeEmail, blurEmail } = useEmailDuplicateCheck({
    email: account.email,
    emailStatus: account.emailStatus,
    patchAccount,
  });

  const [isCompanyUrlInvalid, setIsCompanyUrlInvalid] = useState(false);

  const isEmailWrong = account.emailStatus === "wrong";
  const isEmailError = Boolean(emailError) || isEmailWrong;
  const isEmailPossible = account.emailStatus === "possible";
  let emailMessage = "";
  // 빈 값 안내는 가입 정보 단계와 같은 문구(`info.empty`)를 씀.
  if (emailError === "empty") emailMessage = t("info.empty");
  else if (emailError) emailMessage = t(`company.${emailError}`);
  else if (isEmailWrong) emailMessage = t("company.emailDuplicate");
  else if (
    account.emailStatus === "possible" ||
    account.emailStatus === "needCheck"
  ) {
    emailMessage = t(`company.emailStatus.${account.emailStatus}`);
  }
  const canSubmit = canProceedFromCompany(account, company);

  function handleClickBack() {
    void navigate(ROUTES.login);
  }

  function handleClickNext() {
    setStage("terms");
  }

  function handleChangeEmail(event: ChangeEvent<HTMLInputElement>) {
    changeEmail(event.target.value);
  }

  function handleBlurCompanyUrl() {
    setIsCompanyUrlInvalid(!isValidCompanyUrl(company.companyUrl));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AuthHeader
        title={t("header")}
        onClickBack={handleClickBack}
        progress={JOIN_STEP_PROGRESS.company}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 pt-[30px] tablet:gap-6 tablet:pt-6">
          <AuthText size="xl" weight="bold" tone="heading">
            {t("company.title")}
          </AuthText>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5">
              <AuthText size="md" isRequired>
                {t("company.name")}
              </AuthText>
              <AuthInput
                aria-label={t("company.name")}
                placeholder={t("company.name")}
                value={company.companyName}
                onChange={(event) =>
                  patchCompany({ companyName: event.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <AuthText size="md" isRequired>
                {t("company.contact")}
              </AuthText>
              <AuthInput
                type="tel"
                inputMode="numeric"
                aria-label={t("company.contact")}
                placeholder={t("company.noDashPlaceholder")}
                value={company.companyContact}
                onChange={(event) =>
                  patchCompany({
                    companyContact: digitsOnly(
                      event.target.value,
                      CONTACT_MAX_DIGITS,
                    ),
                  })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2.5">
                <AuthText size="md" isRequired>
                  {t("company.email")}
                </AuthText>
                <AuthInput
                  type="email"
                  autoComplete="email"
                  aria-label={t("company.email")}
                  placeholder={t("company.emailPlaceholder")}
                  value={account.email}
                  onChange={handleChangeEmail}
                  onBlur={blurEmail}
                  state={resolveInputState(isEmailError, isEmailPossible)}
                />
              </div>
              {emailMessage && (
                <AuthText
                  size="sm"
                  role="status"
                  className={resolveMessageClass(isEmailError, isEmailPossible)}
                >
                  {emailMessage}
                </AuthText>
              )}
            </div>

            <FileUploadField
              label={t("company.registration")}
              isRequired
              fileName={company.companyRegistrationFileName}
              upload={uploadCompanyRegistration}
              onChangeUploaded={(fileName, fileSize) =>
                patchCompany({
                  companyRegistrationUploaded: true,
                  companyRegistrationFileName: fileName,
                  companyRegistrationFileSize: fileSize,
                })
              }
            />

            <div className="flex flex-col gap-2.5">
              <AuthText size="md" isRequired>
                {t("company.registrationNumber")}
              </AuthText>
              <AuthInput
                inputMode="numeric"
                aria-label={t("company.registrationNumber")}
                placeholder={t("company.noDashPlaceholder")}
                value={company.companyRegistrationNumber}
                onChange={(event) =>
                  patchCompany({
                    companyRegistrationNumber: digitsOnly(
                      event.target.value,
                      BUSINESS_NUMBER_DIGITS,
                    ),
                  })
                }
              />
            </div>

            <FileUploadField
              label={t("company.mailorderFile")}
              fileName={company.mailorderFileName}
              upload={uploadMailorderBusiness}
              onChangeUploaded={(fileName, fileSize) =>
                patchCompany({
                  mailorderUploaded: true,
                  mailorderFileName: fileName,
                  mailorderFileSize: fileSize,
                })
              }
            />

            <MailorderNumberField
              parts={company.mailorderParts}
              onChangeParts={(mailorderParts) =>
                patchCompany({ mailorderParts })
              }
            />

            <div className="flex flex-col gap-2.5">
              <AuthText size="md">{t("company.classification")}</AuthText>
              <CategorySelect
                value={company.classification}
                onChangeCategory={(classification) =>
                  patchCompany({ classification })
                }
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <AuthText size="md">{t("company.url")}</AuthText>
              <AuthInput
                type="url"
                aria-label={t("company.url")}
                placeholder="https://"
                value={company.companyUrl}
                state={isCompanyUrlInvalid ? "error" : "default"}
                onChange={(event) =>
                  patchCompany({ companyUrl: event.target.value })
                }
                onBlur={handleBlurCompanyUrl}
              />
              {isCompanyUrlInvalid && (
                <AuthText size="sm" role="alert" tone="negative">
                  {t("company.urlError")}
                </AuthText>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 py-5 tablet:pb-[70px] desktop:pb-[120px]">
        <div className="h-12">
          <AuthButton
            color="primary"
            disabled={!canSubmit}
            onClick={handleClickNext}
          >
            <AuthText as="span" tone="light">
              {t("next")}
            </AuthText>
          </AuthButton>
        </div>
      </div>

      {import.meta.env.DEV && (
        <button
          type="button"
          className="text-gray-400 underline"
          onClick={handleClickNext}
        >
          <AuthText as="span" size="sm">
            {t("dev.skipStep")}
          </AuthText>
        </button>
      )}
    </div>
  );
}
