import { X } from "lucide-react";
import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import { isSimpleSuccess, readFailureReason } from "@/entities/account";
import { SubHeader } from "@/shared/components/app-header";
import { FormField, PasswordInput } from "@/shared/components/form-field";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { createSubAccount, updateSubAccount } from "../api/create-api";
import { useRefreshSubAccounts } from "../api/use-sub-accounts";
import {
  canCreateSubAccount,
  canEditSubAccount,
  EMPTY_CREATE_VALUES,
  toCreateSubAccountBody,
  toEditFormValues,
  toUpdateSubAccountBody,
  validateCreateForm,
} from "../lib/create-form";
import { useIdCheck } from "../lib/use-id-check";
import {
  EXISTING_ID_REASON,
  PROFILE_IMAGE_FAILURE_REASONS,
} from "../model/constants";
import { ProfileImageField } from "./ProfileImageField";

import type { CreateFormValues } from "../lib/create-form";
import type { SubAccountViewModel } from "../model/types";
import type { PickedImage } from "./ProfileImageField";
import type { ChangeEvent, FormEvent } from "react";

const PASSWORD_MAX_LENGTH = 20;
const ID_MAX_LENGTH = 20;

interface SubAccountFormPanelProps {
  /** 수정할 Sub ID. 없으면 생성 폼. 대상이 바뀌면 호출하는 쪽이 `key`로 새로 그려 입력값을 초기화함. */
  account?: SubAccountViewModel;
  onClose: () => void;
  /** 서버에 생성·수정된 뒤 호출. 호출하는 쪽이 패널을 닫음. 목록은 여기서 다시 읽음. */
  onSaved?: () => void;
  className?: string;
}

// Figma Sub ID 생성·수정(10724:186372 패널·10724:187263 TAB·10724:187989 MO): 서브헤더(제목 + X) · 필드 · 하단 고정 "Sub ID 생성하기"·"수정하기".
// 두 화면은 필드가 같음(프로필 이미지·담당자명·아이디 + 중복 확인·비밀번호·비밀번호 확인·이메일). 필드 간격은 MO 8·TAB 이상 12,
// 안쪽 여백은 MO 16·TAB 이상 20. PC는 고정 높이 패널이라 본문이 안에서 스크롤함.
// 수정(Master가 Sub ID 정보를 고침)은 `PATCH /sub/{accountIdx}`로 바뀐 필드만 보냄(docs/mypage-api.md §4-21).
export function SubAccountFormPanel({
  account,
  onClose,
  onSaved,
  className,
}: SubAccountFormPanelProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const { t: tCommon } = useTranslation();
  const refreshSubAccounts = useRefreshSubAccounts();
  const isEdit = account !== undefined;

  const [initialValues] = useState<CreateFormValues>(() =>
    account ? toEditFormValues(account) : EMPTY_CREATE_VALUES,
  );
  const [values, setValues] = useState<CreateFormValues>(initialValues);
  const [isIdTouched, setIsIdTouched] = useState(false);
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const idCheck = useIdCheck();

  const errors = validateCreateForm(values);
  const canSubmit =
    !isSubmitting &&
    (isEdit
      ? canEditSubAccount(values, initialValues, errors, idCheck.status)
      : canCreateSubAccount(values, errors, idCheck.status));
  const isIdValidFormat =
    values.identifier !== "" && errors.identifier === null;
  // 수정에서 아이디를 그대로 두면 중복확인이 필요 없음.
  const isIdUnchanged =
    isEdit && values.identifier.trim() === initialValues.identifier;

  function handleChangeField(field: keyof CreateFormValues) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));
      if (field === "identifier") idCheck.reset();
    };
  }

  async function handleClickCheckId() {
    const identifier = values.identifier.trim();
    setIsIdTouched(true);
    if (!identifier || !isIdValidFormat) return;
    await idCheck.check(identifier);
  }

  function submitToServer() {
    const image = pickedImage?.file ?? null;
    return account
      ? updateSubAccount(
          account.accountIdx,
          toUpdateSubAccountBody(values, initialValues),
          image,
        )
      : createSubAccount(toCreateSubAccountBody(values), image);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    const [error, response] = await tryit(submitToServer)();
    setIsSubmitting(false);
    const reason = readFailureReason(error);
    // 이미지 저장만 실패해도 계정은 이미 만들어져서(서버가 롤백하지 않음) 생성으로 처리함. 다시 보내면 아이디 중복이 됨.
    // (수정에서 이미지만 실패하는 경우도 같은 이유로 저장된 것으로 봄.)
    const isCreatedWithoutImage =
      reason !== undefined && PROFILE_IMAGE_FAILURE_REASONS.includes(reason);
    if (reason === EXISTING_ID_REASON) {
      // 중복확인 뒤 그 사이 다른 곳에서 같은 아이디를 만든 경우.
      idCheck.markTaken();
      return;
    }
    if (!isCreatedWithoutImage && (error || !isSimpleSuccess(response))) {
      toast.error(tCommon("feedback.saveFailed"));
      return;
    }
    toast(isEdit ? t("edit.toast.updated") : t("create.toast.created"));
    void refreshSubAccounts();
    onSaved?.();
  }

  // 아이디 칸 아래 문구: 오류가 우선이고, 통과하면 안내, 형식은 맞는데 확인을 안 했으면 확인을 요구함.
  function getIdErrorText() {
    if (errors.identifier) return t("create.error.identifier.format");
    if (idCheck.status === "taken") return t("create.error.identifier.taken");
    if (idCheck.status === "error") return t("create.error.identifier.check");
    if (
      idCheck.status === "idle" &&
      isIdValidFormat &&
      isIdTouched &&
      !isIdUnchanged
    ) {
      return t("create.error.identifier.needCheck");
    }
    return undefined;
  }

  const passwordLabel = t("create.field.password.label");
  const passwordCheckLabel = t("create.field.passwordCheck.label");

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn("flex min-h-0 flex-1 flex-col bg-background", className)}
    >
      <SubHeader
        // TAB은 제목줄을 위에 고정(시안). MO는 탭 줄이 이미 고정돼 있어 뒤로 보내 겹치지 않게 하고, PC는 패널 안 고정 높이라 그대로 둠.
        className="sticky top-0 z-0 tablet:z-10 desktop:static"
        title={isEdit ? t("edit.title") : t("create.title")}
        actions={
          <Button
            type="button"
            variant="ghost-foreground"
            size="icon"
            aria-label={tCommon("action.close")}
            onClick={onClose}
          >
            <X />
          </Button>
        }
      />
      <div className="flex flex-1 flex-col gap-2 p-4 tablet:gap-3 tablet:p-5 desktop:min-h-0 desktop:overflow-y-auto">
        <ProfileImageField image={pickedImage} onChange={setPickedImage} />

        <FormField label={t("create.field.name.label")} isRequired>
          {(control) => (
            <Input
              {...control}
              autoComplete="off"
              placeholder={t("create.field.name.placeholder")}
              value={values.name}
              onChange={handleChangeField("name")}
            />
          )}
        </FormField>

        <FormField
          label={t("create.field.identifier.label")}
          isRequired
          errorText={getIdErrorText()}
          helpText={
            idCheck.status === "available"
              ? t("create.status.identifier.available")
              : undefined
          }
        >
          {(control) => (
            <div className="flex items-center gap-2">
              <Input
                {...control}
                autoComplete="off"
                maxLength={ID_MAX_LENGTH}
                placeholder={t("create.field.identifier.placeholder")}
                value={values.identifier}
                onChange={handleChangeField("identifier")}
                onBlur={() => setIsIdTouched(true)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={idCheck.isChecking}
                onClick={() => void handleClickCheckId()}
              >
                {t("create.field.identifier.check")}
              </Button>
            </div>
          )}
        </FormField>

        {/* 수정에서는 바꿀 때만 입력하므로 필수 표시를 뺌(시안은 `*`, 2026-10-27 사용자 결정으로 동작과 맞춤). */}
        <FormField
          label={passwordLabel}
          isRequired={!isEdit}
          errorText={
            errors.password
              ? t(`create.error.password.${errors.password}`)
              : undefined
          }
        >
          {(control) => (
            <PasswordInput
              {...control}
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              placeholder={t("create.field.password.placeholder")}
              value={values.password}
              onChange={handleChangeField("password")}
              showLabel={tCommon("password.show", { label: passwordLabel })}
              hideLabel={tCommon("password.hide", { label: passwordLabel })}
            />
          )}
        </FormField>

        <FormField
          label={passwordCheckLabel}
          isRequired={!isEdit}
          errorText={
            errors.passwordCheck
              ? t("create.error.passwordCheck.mismatch")
              : undefined
          }
        >
          {(control) => (
            <PasswordInput
              {...control}
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              placeholder={t("create.field.passwordCheck.placeholder")}
              value={values.passwordCheck}
              onChange={handleChangeField("passwordCheck")}
              showLabel={tCommon("password.show", {
                label: passwordCheckLabel,
              })}
              hideLabel={tCommon("password.hide", {
                label: passwordCheckLabel,
              })}
            />
          )}
        </FormField>

        <FormField
          label={t("create.field.email.label")}
          isRequired
          errorText={errors.email ? t("create.error.email.format") : undefined}
        >
          {(control) => (
            <Input
              {...control}
              type="email"
              autoComplete="off"
              placeholder={t("create.field.email.placeholder")}
              value={values.email}
              onChange={handleChangeField("email")}
            />
          )}
        </FormField>
      </div>
      <div className="sticky bottom-0 border-t bg-background p-4 tablet:p-5">
        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {isEdit ? t("edit.submit") : t("create.submit")}
        </Button>
      </div>
    </form>
  );
}
