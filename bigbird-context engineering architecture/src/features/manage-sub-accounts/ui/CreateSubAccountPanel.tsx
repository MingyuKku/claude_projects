import { X } from "lucide-react";
import { tryit } from "radash";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  checkAccountValue,
  checkUploadFile,
  IMAGE_EXTENSIONS,
  isSimpleSuccess,
} from "@/entities/account";
import { SubHeader } from "@/shared/components/app-header";
import { AvatarEdit } from "@/shared/components/avatar-edit";
import { FormField, PasswordInput } from "@/shared/components/form-field";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { createSubAccount } from "../api/create-api";
import {
  canCreateSubAccount,
  EMPTY_CREATE_VALUES,
  isUncheckableId,
  toCreateSubAccountBody,
  validateCreateForm,
} from "../lib/create-form";

import type { CreateFormValues, IdCheckStatus } from "../lib/create-form";
import type { ChangeEvent, FormEvent } from "react";

const IMAGE_ACCEPT = IMAGE_EXTENSIONS.map((extension) => `.${extension}`).join(
  ",",
);
const PASSWORD_MAX_LENGTH = 20;
const ID_MAX_LENGTH = 20;

interface PickedImage {
  previewUrl: string;
}

interface CreateSubAccountPanelProps {
  onClose: () => void;
  /** 서버에 생성된 뒤 호출. 호출하는 쪽이 패널을 닫고 목록을 다시 읽음. */
  onCreated: () => void;
  className?: string;
}

// Figma Sub ID 생성(10061:201335 패널·10061:204317 TAB·10061:206636 MO): 서브헤더(제목 + X) · 필드 · 하단 고정 "Sub ID 생성하기".
// 필드 간격은 MO 8·TAB 이상 12, 안쪽 여백은 MO 16·TAB 이상 20. PC는 고정 높이 패널이라 본문이 안에서 스크롤함.
export function CreateSubAccountPanel({
  onClose,
  onCreated,
  className,
}: CreateSubAccountPanelProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const { t: tCommon } = useTranslation();

  const [values, setValues] = useState<CreateFormValues>(EMPTY_CREATE_VALUES);
  const [idStatus, setIdStatus] = useState<IdCheckStatus>("idle");
  const [isIdTouched, setIsIdTouched] = useState(false);
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  /** 중복확인 응답이 늦게 와도 그 사이 고친 아이디에는 반영하지 않기 위해 마지막으로 확인을 요청한 아이디를 기억함. */
  const requestedIdRef = useRef("");

  // 고른 이미지를 바꾸거나 패널을 닫을 때 미리보기 주소를 풀어 줌.
  useEffect(() => {
    return () => {
      if (pickedImage) URL.revokeObjectURL(pickedImage.previewUrl);
    };
  }, [pickedImage]);

  const errors = validateCreateForm(values);
  const canSubmit =
    canCreateSubAccount(values, errors, idStatus) && !isSubmitting;
  const isIdValidFormat =
    values.identifier !== "" && errors.identifier === null;

  function handleChangeField(field: keyof CreateFormValues) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));
      // 아이디를 고치면 이전 중복확인 결과는 무효(v2는 고쳐도 통과 상태가 남던 버그).
      if (field === "identifier") setIdStatus("idle");
    };
  }

  async function handleClickCheckId() {
    const identifier = values.identifier.trim();
    setIsIdTouched(true);
    if (!identifier || !isIdValidFormat) return;
    // 금지어는 서버에 묻지 않고 중복과 같은 문구로 알림(회원가입과 같음).
    if (isUncheckableId(identifier)) {
      setIdStatus("taken");
      return;
    }
    requestedIdRef.current = identifier;
    setIsCheckingId(true);
    const [error, result] = await tryit(checkAccountValue)("id", identifier);
    setIsCheckingId(false);
    if (requestedIdRef.current !== identifier) return;
    if (error) setIdStatus("error");
    else setIdStatus(result === "available" ? "available" : "taken");
  }

  function handleChangeImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 골라도 change가 일어나도록 비움.
    event.target.value = "";
    if (!file) return;
    const rejection = checkUploadFile(file, IMAGE_EXTENSIONS);
    if (rejection) {
      toast.error(t(`create.profileImage.error.${rejection}`));
      return;
    }
    setPickedImage({ previewUrl: URL.createObjectURL(file) });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    const [error, response] = await tryit(createSubAccount)(
      toCreateSubAccountBody(values),
    );
    setIsSubmitting(false);
    if (error || !isSimpleSuccess(response)) {
      toast.error(tCommon("feedback.saveFailed"));
      return;
    }
    toast(t("create.toast.created"));
    onCreated();
  }

  // 아이디 칸 아래 문구: 오류가 우선이고, 통과하면 안내, 형식은 맞는데 확인을 안 했으면 확인을 요구함.
  function getIdErrorText() {
    if (errors.identifier) return t("create.error.identifier.format");
    if (idStatus === "taken") return t("create.error.identifier.taken");
    if (idStatus === "error") return t("create.error.identifier.check");
    if (idStatus === "idle" && isIdValidFormat && isIdTouched) {
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
        title={t("create.title")}
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
        <div className="flex flex-col gap-2">
          <p className="text-sm leading-5 font-medium text-foreground">
            {t("create.profileImage.label")}
          </p>
          <div className="flex justify-center">
            <AvatarEdit
              src={pickedImage?.previewUrl}
              alt={t("create.profileImage.alt")}
              editLabel={t("create.profileImage.edit")}
              onClickEdit={() => imageInputRef.current?.click()}
            />
            <input
              ref={imageInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              tabIndex={-1}
              aria-hidden="true"
              className="hidden"
              onChange={handleChangeImage}
            />
          </div>
        </div>

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
            idStatus === "available"
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
                disabled={isCheckingId}
                onClick={() => void handleClickCheckId()}
              >
                {t("create.field.identifier.check")}
              </Button>
            </div>
          )}
        </FormField>

        <FormField
          label={passwordLabel}
          isRequired
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
          isRequired
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

        <FormField label={t("create.field.phone.label")} isRequired>
          {(control) => (
            <Input
              {...control}
              type="tel"
              autoComplete="off"
              placeholder={t("create.field.phone.placeholder")}
              value={values.phone}
              onChange={handleChangeField("phone")}
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
          {t("create.submit")}
        </Button>
      </div>
    </form>
  );
}
