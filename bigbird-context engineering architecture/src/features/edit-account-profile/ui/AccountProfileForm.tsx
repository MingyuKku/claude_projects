import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  checkUploadFile,
  formatPhoneNumber,
  IMAGE_EXTENSIONS,
} from "@/entities/account";
import { AvatarEdit } from "@/shared/components/avatar-edit";
import { FormRow, PasswordInput } from "@/shared/components/form-field";
import { SectionCard } from "@/shared/components/section-card";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { useProfileImage } from "../api/use-profile-image";
import {
  canSaveProfile,
  getProfileSavePlan,
  validateProfileForm,
} from "../lib/profile-form";
import { saveAccountProfile } from "../lib/save-account-profile";
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH } from "../model/constants";

import type { AccountRole } from "../lib/save-account-profile";
import type { AccountProfileViewModel } from "@/entities/account";
import type { ChangeEvent, FormEvent } from "react";

const IMAGE_ACCEPT = IMAGE_EXTENSIONS.map((extension) => `.${extension}`).join(
  ",",
);

interface AccountProfileFormProps {
  /** Master와 Sub ID는 저장 API 경로가 다름. 기본은 Master. */
  accountType?: AccountRole;
  profile: AccountProfileViewModel;
  /** 회원 탈퇴 버튼을 보일 때만 넘김(Master). */
  onClickWithdraw?: () => void;
  /** 서버에 하나라도 반영된 뒤 호출. 화면이 정보를 다시 읽음. */
  onSaved: () => void;
  className?: string;
}

interface PickedImage {
  file: File;
  previewUrl: string;
}

// Figma 정보 수정(7046:124807): PC·TAB은 라벨 왼쪽·입력 오른쪽 표, MO는 라벨 위·입력 아래.
export function AccountProfileForm({
  accountType = "master",
  profile,
  onClickWithdraw,
  onSaved,
  className,
}: AccountProfileFormProps) {
  const { t } = useTranslation("features/edit-account-profile");
  const { t: tCommon } = useTranslation();
  const { profileUrl, mutate: mutateProfileImage } = useProfileImage();

  const [values, setValues] = useState({
    password: "",
    passwordCheck: "",
    email: profile.email,
  });
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  // Sub ID는 `GET /profile`이 권한 오류로 거부되는 경우를 대비해 저장한 이미지를 이 화면에서만 계속 보임(미리보기 주소는 화면을 떠날 때 풀림).
  const [savedImage, setSavedImage] = useState<PickedImage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 고른 이미지를 바꾸거나 화면을 떠날 때 미리보기 주소를 풀어 줌.
  useEffect(() => {
    return () => {
      if (pickedImage) URL.revokeObjectURL(pickedImage.previewUrl);
    };
  }, [pickedImage]);
  useEffect(() => {
    return () => {
      if (savedImage) URL.revokeObjectURL(savedImage.previewUrl);
    };
  }, [savedImage]);

  const errors = validateProfileForm(values, {
    identifier: profile.identifier,
    initialEmail: profile.email,
  });
  const plan = getProfileSavePlan(values, profile.email, pickedImage !== null);
  const canSave = canSaveProfile(values, errors, plan);

  function handleChangeField(field: keyof typeof values) {
    return (event: ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function handleChangeImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 골라도 change가 일어나도록 비움.
    event.target.value = "";
    if (!file) return;
    const rejection = checkUploadFile(file, IMAGE_EXTENSIONS);
    if (rejection) {
      toast.error(t(`form.profileImage.error.${rejection}`));
      return;
    }
    setPickedImage({ file, previewUrl: URL.createObjectURL(file) });
  }

  function handleClickCancel() {
    setValues({ password: "", passwordCheck: "", email: profile.email });
    setPickedImage(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave || isSaving) return;
    setIsSaving(true);
    const { completed, failure } = await saveAccountProfile({
      role: accountType,
      plan,
      password: values.password,
      email: values.email,
      certIdx: profile.certIdx,
      imageFile: pickedImage?.file ?? null,
      hasExistingImage: Boolean(profileUrl ?? savedImage),
    });
    setIsSaving(false);

    if (completed.includes("password")) {
      setValues((prev) => ({ ...prev, password: "", passwordCheck: "" }));
    }
    if (completed.includes("image")) {
      // 고른 이미지의 미리보기 주소는 아래에서 풀리므로 저장본은 새 주소로 따로 만듦.
      if (accountType === "sub" && pickedImage) {
        setSavedImage({
          file: pickedImage.file,
          previewUrl: URL.createObjectURL(pickedImage.file),
        });
      }
      setPickedImage(null);
    }
    if (completed.length > 0) {
      void mutateProfileImage();
      onSaved();
    }

    if (failure === "generic") toast.error(tCommon("feedback.saveFailed"));
    else if (failure) toast.error(t(`toast.save.${failure}`));
    else toast(tCommon("feedback.saved"));
  }

  const passwordLabel = t("form.password.label");
  const passwordCheckLabel = t("form.passwordCheck.label");

  return (
    <SectionCard title={t("form.title")} className={className}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col">
        <div className="flex flex-col p-3 tablet:p-5">
          <div className="flex flex-col gap-2 p-3.5 tablet:gap-3 tablet:p-0">
            <div className="grid grid-cols-1 tablet:min-h-12 tablet:grid-cols-2 tablet:items-start">
              <p className="text-sm leading-5 font-medium text-foreground tablet:min-h-12 tablet:px-4 tablet:font-semibold">
                {t("form.profileImage.label")}
              </p>
              <div className="flex justify-center tablet:justify-start tablet:px-4">
                <AvatarEdit
                  src={
                    pickedImage?.previewUrl ??
                    profileUrl ??
                    savedImage?.previewUrl ??
                    undefined
                  }
                  alt={t("form.profileImage.alt")}
                  editLabel={t("form.profileImage.edit")}
                  onClickEdit={() => imageInputRef.current?.click()}
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="hidden"
                  onChange={handleChangeImage}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 tablet:gap-0">
              <FormRow
                label={passwordLabel}
                errorText={
                  errors.password
                    ? t(`form.password.error.${errors.password}`)
                    : undefined
                }
              >
                {(control) => (
                  <PasswordInput
                    {...control}
                    autoComplete="new-password"
                    maxLength={PASSWORD_MAX_LENGTH}
                    value={values.password}
                    onChange={handleChangeField("password")}
                    showLabel={tCommon("password.show", {
                      label: passwordLabel,
                    })}
                    hideLabel={tCommon("password.hide", {
                      label: passwordLabel,
                    })}
                  />
                )}
              </FormRow>
              <FormRow
                label={passwordCheckLabel}
                errorText={
                  errors.passwordCheck
                    ? t("form.passwordCheck.mismatch")
                    : undefined
                }
              >
                {(control) => (
                  <PasswordInput
                    {...control}
                    autoComplete="new-password"
                    maxLength={PASSWORD_MAX_LENGTH}
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
              </FormRow>
              <FormRow label={t("form.phone.label")}>
                {(control) => (
                  <div className="flex items-center gap-2">
                    <Input
                      {...control}
                      readOnly
                      value={formatPhoneNumber(profile.phone)}
                    />
                    {/* 본인인증 경로 확인 전(스펙 §7 B-12)이라 준비 중 안내. */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => toast(tCommon("status.comingSoon"))}
                    >
                      {t("form.phone.verify")}
                    </Button>
                  </div>
                )}
              </FormRow>
              <FormRow
                label={t("form.email.label")}
                errorText={
                  errors.email ? t("form.email.error.format") : undefined
                }
              >
                {(control) => (
                  <Input
                    {...control}
                    type="email"
                    autoComplete="email"
                    maxLength={EMAIL_MAX_LENGTH}
                    value={values.email}
                    onChange={handleChangeField("email")}
                  />
                )}
              </FormRow>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 p-3 tablet:p-5">
          {onClickWithdraw ? (
            <Button
              type="button"
              variant="outline-muted"
              size="xs"
              onClick={onClickWithdraw}
            >
              {t("form.withdraw")}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={handleClickCancel}
            >
              {tCommon("action.cancel")}
            </Button>
            <Button type="submit" disabled={!canSave || isSaving}>
              {tCommon("action.save")}
            </Button>
          </div>
        </div>
      </form>
    </SectionCard>
  );
}
