import { tryit } from "radash";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";

import {
  checkStatusMessage,
  digitsOnly,
  EMAIL_DUPLICATE_MESSAGE,
  EMAIL_FORMAT_ERROR_MESSAGE,
  FIELD_EMPTY_MESSAGE,
  isValidCompanyUrl,
  isValidEmailFormat,
} from "@/entities/account";
import {
  AuthButton,
  AuthHeader,
  AuthInput,
  AuthText,
} from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";

import {
  checkEmail,
  uploadCompanyRegistration,
  uploadMailorderBusiness,
} from "../api/join-api";
import {
  canProceedFromCompany,
  resolveInputState,
  resolveMessageClass,
} from "../lib/gating";
import {
  BUSINESS_NUMBER_DIGITS,
  COMPANY_URL_FORMAT_ERROR_MESSAGE,
  CONTACT_MAX_DIGITS,
  EMAIL_CHECK_DEBOUNCE_MS,
  EMAIL_CHECK_ERROR_MESSAGE,
  JOIN_STEP_PROGRESS,
  MAILORDER_REGION_MAX_LENGTH,
  MAILORDER_SERIAL_DIGITS,
  MAILORDER_YEAR_DIGITS,
  NOT_HANGUL_PATTERN,
} from "../model/constants";
import { useJoinStore } from "../model/join-store-context";
import { CategorySelect } from "./CategorySelect";
import { FileUploadField } from "./FileUploadField";

import type { ChangeEvent, CompositionEvent } from "react";

type MailorderParts = [string, string, string];
type MailorderIndex = 0 | 1 | 2;

const MAILORDER_REGION_INDEX = 1;
const MAILORDER_DIGIT_LIMITS = {
  0: MAILORDER_YEAR_DIGITS,
  2: MAILORDER_SERIAL_DIGITS,
} as const;

function replaceMailorderPart(
  parts: MailorderParts,
  index: MailorderIndex,
  value: string,
): MailorderParts {
  const next: MailorderParts = [...parts];
  next[index] = value;
  return next;
}

function sanitizeMailorderPart(index: MailorderIndex, value: string) {
  if (index === MAILORDER_REGION_INDEX) {
    return value
      .replace(NOT_HANGUL_PATTERN, "")
      .slice(0, MAILORDER_REGION_MAX_LENGTH);
  }
  return digitsOnly(value, MAILORDER_DIGIT_LIMITS[index]);
}

export function JoinCompanyStep() {
  const account = useJoinStore((state) => state.account);
  const company = useJoinStore((state) => state.company);
  const patchAccount = useJoinStore((state) => state.patchAccount);
  const patchCompany = useJoinStore((state) => state.patchCompany);
  const setStage = useJoinStore((state) => state.setStage);
  const navigate = useNavigate();

  const [emailError, setEmailError] = useState("");
  const [companyUrlError, setCompanyUrlError] = useState("");
  const emailCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function runEmailCheck(email: string) {
    const [error, response] = await tryit(checkEmail)(email);
    if (error) {
      setEmailError(EMAIL_CHECK_ERROR_MESSAGE);
      return;
    }
    patchAccount({ emailStatus: response.result > 0 ? "wrong" : "possible" });
  }

  function handleChangeEmail(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    patchAccount({ email: value, emailStatus: "idle" });
    setEmailError("");

    if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
    if (isValidEmailFormat(value)) {
      emailCheckTimer.current = setTimeout(
        () => void runEmailCheck(value),
        EMAIL_CHECK_DEBOUNCE_MS,
      );
    }
  }

  function handleBlurEmail() {
    if (emailCheckTimer.current) {
      clearTimeout(emailCheckTimer.current);
      emailCheckTimer.current = null;
    }
    if (!account.email) {
      setEmailError(FIELD_EMPTY_MESSAGE);
      return;
    }
    if (!isValidEmailFormat(account.email)) {
      setEmailError(EMAIL_FORMAT_ERROR_MESSAGE);
      return;
    }
    // The debounce may already have an answer; do not ask twice.
    if (account.emailStatus === "possible" || account.emailStatus === "wrong")
      return;
    void runEmailCheck(account.email);
  }

  function handleChangeMailorderPart(index: MailorderIndex, value: string) {
    patchCompany({
      mailorderParts: replaceMailorderPart(
        company.mailorderParts,
        index,
        sanitizeMailorderPart(index, value),
      ),
    });
  }

  /**
   * While composing Hangul, unfinished jamo fall outside the `가-힣` range and the
   * filter would erase them and break the composition. Keep the raw value during
   * composition and filter after it ends.
   */
  function handleChangeRegion(event: ChangeEvent<HTMLInputElement>) {
    if ((event.nativeEvent as InputEvent).isComposing) {
      patchCompany({
        mailorderParts: replaceMailorderPart(
          company.mailorderParts,
          MAILORDER_REGION_INDEX,
          event.target.value,
        ),
      });
      return;
    }
    handleChangeMailorderPart(MAILORDER_REGION_INDEX, event.target.value);
  }

  const isEmailWrong = account.emailStatus === "wrong";
  const emailMessage =
    emailError ||
    (isEmailWrong
      ? EMAIL_DUPLICATE_MESSAGE
      : checkStatusMessage(account.emailStatus, "이메일"));
  const isEmailError = Boolean(emailError) || isEmailWrong;
  const isEmailPossible = account.emailStatus === "possible";

  const canSubmit = canProceedFromCompany(account, company);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AuthHeader
        title="회원가입"
        onClickBack={() => navigate(ROUTES.login)}
        progress={JOIN_STEP_PROGRESS.company}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 pt-[30px] tablet:gap-6 tablet:pt-6">
          <AuthText size="xl" weight="bold" className="text-heading!">
            2. 회사 정보
          </AuthText>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5">
              <AuthText size="md" required>
                회사명
              </AuthText>
              <AuthInput
                aria-label="회사명"
                placeholder="회사명"
                value={company.companyName}
                onChange={(event) =>
                  patchCompany({ companyName: event.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <AuthText size="md" required>
                담당자 연락처
              </AuthText>
              <AuthInput
                type="tel"
                inputMode="numeric"
                aria-label="담당자 연락처"
                placeholder="-없이 입력"
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
                <AuthText size="md" required>
                  이메일
                </AuthText>
                <AuthInput
                  type="email"
                  autoComplete="email"
                  aria-label="이메일"
                  placeholder="이메일을 입력하세요."
                  value={account.email}
                  onChange={handleChangeEmail}
                  onBlur={handleBlurEmail}
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
              label="사업자 등록증"
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
              <AuthText size="md" required>
                사업자 등록번호
              </AuthText>
              <AuthInput
                inputMode="numeric"
                aria-label="사업자 등록번호"
                placeholder="-없이 입력"
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
              label="통신판매 신고증"
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

            <div className="flex flex-col gap-2">
              <AuthText size="md">통신판매 번호</AuthText>
              <div className="flex w-full gap-2.5">
                <div className="h-11 min-w-0 flex-1">
                  <AuthInput
                    inputMode="numeric"
                    aria-label="통신판매 신고번호 연도"
                    value={company.mailorderParts[0]}
                    onChange={(event) =>
                      handleChangeMailorderPart(0, event.target.value)
                    }
                  />
                </div>
                <div className="h-11 min-w-0 flex-1">
                  <AuthInput
                    aria-label="통신판매 신고번호 지역"
                    placeholder="한글"
                    value={company.mailorderParts[1]}
                    onChange={handleChangeRegion}
                    onCompositionEnd={(
                      event: CompositionEvent<HTMLInputElement>,
                    ) =>
                      handleChangeMailorderPart(
                        MAILORDER_REGION_INDEX,
                        event.currentTarget.value,
                      )
                    }
                  />
                </div>
                <div className="h-11 min-w-0 flex-1">
                  <AuthInput
                    inputMode="numeric"
                    aria-label="통신판매 신고번호 일련번호"
                    value={company.mailorderParts[2]}
                    onChange={(event) =>
                      handleChangeMailorderPart(2, event.target.value)
                    }
                  />
                </div>
              </div>
              <AuthText size="sm" className="text-gray-400!">
                한글이 있는 경우만 한글 기입
              </AuthText>
            </div>

            <div className="flex flex-col gap-2.5">
              <AuthText size="md">회사 분류</AuthText>
              <CategorySelect
                value={company.classification}
                onChangeCategory={(classification) =>
                  patchCompany({ classification })
                }
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <AuthText size="md">회사 URL</AuthText>
              <AuthInput
                type="url"
                aria-label="회사 URL"
                placeholder="https://"
                value={company.companyUrl}
                state={companyUrlError ? "error" : "default"}
                onChange={(event) =>
                  patchCompany({ companyUrl: event.target.value })
                }
                onBlur={() =>
                  setCompanyUrlError(
                    isValidCompanyUrl(company.companyUrl)
                      ? ""
                      : COMPANY_URL_FORMAT_ERROR_MESSAGE,
                  )
                }
              />
              {companyUrlError && (
                <AuthText size="sm" role="alert" className="text-negative!">
                  {companyUrlError}
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
            onClick={() => setStage("terms")}
          >
            <AuthText as="span" className="text-light!">
              다음
            </AuthText>
          </AuthButton>
        </div>
      </div>

      {import.meta.env.DEV && (
        <button
          type="button"
          className="text-gray-400! underline"
          onClick={() => setStage("terms")}
        >
          <AuthText as="span" size="sm">
            [DEV] 다음 단계로 건너뛰기
          </AuthText>
        </button>
      )}
    </div>
  );
}
