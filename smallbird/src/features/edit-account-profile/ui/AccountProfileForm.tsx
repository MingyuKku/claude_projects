import { useState } from "react";
import { toast } from "sonner";

import { FormRow } from "@/shared/components/form-field";
import { InfoRow } from "@/shared/components/info-row";
import { SectionCard } from "@/shared/components/section-card";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { formatJoinedAt } from "../lib/format-joined-at";
import {
  canSaveProfile,
  getProfileSavePlan,
  validateProfileForm,
} from "../lib/profile-form";
import { saveAccountProfile } from "../lib/save-account-profile";
import { usePhoneVerification } from "../lib/use-phone-verification";
import { useProfileImagePicker } from "../lib/use-profile-image-picker";
import { EMAIL_MAX_LENGTH } from "../model/constants";
import { PhoneVerifyRow } from "./PhoneVerifyRow";
import { ProfileImageField } from "./ProfileImageField";
import { ProfilePasswordFields } from "./ProfilePasswordFields";

import type { ProfileImageSource } from "../api/use-profile-image";
import type { AccountRole } from "../lib/save-account-profile";
import type { AccountProfileViewModel } from "@/entities/account";
import type { ChangeEvent, FormEvent } from "react";

interface AccountProfileFormProps {
  /** Master와 Sub ID는 저장 API 경로가 다름. 기본은 Master. */
  accountType?: AccountRole;
  profile: AccountProfileViewModel;
  imageSource: ProfileImageSource;
  /** 회원 탈퇴 버튼을 보일 때만 넘김(Master). */
  onClickWithdraw?: () => void;
  /** 서버에 하나라도 반영된 뒤 호출. 화면이 정보를 다시 읽음. */
  onSaved: () => void;
  /** 수정 모드를 끝낼 때 호출: 취소를 누르거나, 모두 저장에 성공했을 때. */
  onFinishEdit?: () => void;
  className?: string;
}

// Figma 정보 수정(7046:124807): PC·TAB은 라벨 왼쪽·입력 오른쪽 표, MO는 라벨 위·입력 아래.
export function AccountProfileForm({
  accountType = "master",
  profile,
  imageSource,
  onClickWithdraw,
  onSaved,
  onFinishEdit,
  className,
}: AccountProfileFormProps) {
  const { t } = useTranslation("features/edit-account-profile");
  const { t: tCommon } = useTranslation();
  const image = useProfileImagePicker(imageSource);

  const [values, setValues] = useState({
    password: "",
    passwordCheck: "",
    email: profile.email,
  });
  const [isSaving, setIsSaving] = useState(false);
  // 모바일은 KMC로 페이지를 옮겼다 돌아오므로 입력 중이던 이메일을 되살림.
  const {
    state: phoneVerification,
    startVerification,
    resetVerification,
  } = usePhoneVerification((draft) =>
    setValues((prev) => ({ ...prev, email: draft.email })),
  );

  const errors = validateProfileForm(values, {
    identifier: profile.identifier,
    initialEmail: profile.email,
  });
  const verifiedPhone =
    phoneVerification.status === "verified" ? phoneVerification : null;
  const plan = getProfileSavePlan(values, profile.email, {
    hasNewImage: image.pickedFile !== null,
    hasVerifiedPhone: verifiedPhone !== null,
  });
  const canSave = canSaveProfile(values, errors, plan);

  function handleChangeField(field: keyof typeof values) {
    return (event: ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function handleClickCancel() {
    setValues({ password: "", passwordCheck: "", email: profile.email });
    image.discardPicked();
    resetVerification();
    onFinishEdit?.();
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
      verifiedPhone,
      imageFile: image.pickedFile,
      hasExistingImage: image.hasExistingImage,
    });
    setIsSaving(false);

    // 저장한 번호는 다시 읽은 정보로 보임.
    if (completed.includes("phone")) resetVerification();
    if (completed.includes("password")) {
      setValues((prev) => ({ ...prev, password: "", passwordCheck: "" }));
    }
    if (completed.includes("image")) image.discardPicked();
    if (completed.length > 0) {
      void image.refresh();
      onSaved();
    }

    if (failure === "generic") toast.error(tCommon("feedback.saveFailed"));
    else if (failure) toast.error(t(`toast.save.${failure}`));
    else {
      toast(tCommon("feedback.saved"));
      onFinishEdit?.();
    }
  }

  const isMaster = accountType === "master";
  // Sub ID는 시안의 라벨이 다르고(담당자 명·아이디 명·이메일 주소·생성일) 휴대폰 번호 행이 없음.
  const labels = isMaster
    ? {
        id: t("info.id"),
        name: t("info.name"),
        email: t("form.email.label"),
        joinedAt: t("info.joinedAt"),
      }
    : {
        id: t("sub.id"),
        name: t("sub.name"),
        email: t("sub.email"),
        joinedAt: t("sub.joinedAt"),
      };
  const idValue = profile.identifier;
  const joinedAtValue = formatJoinedAt(profile.joinedAt);
  const rowClassName = "hidden tablet:flex";

  return (
    <SectionCard title={t("info.title")} className={className}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col">
        <div className="flex flex-col p-4 tablet:p-5">
          <div className="flex flex-col gap-3">
            <ProfileImageField
              src={image.previewSrc}
              inputRef={image.inputRef}
              onClickEdit={image.openPicker}
              onChange={image.handleChange}
            />

            {/* MO는 읽기 전용 값을 회색 박스로 묶음. */}
            <div className="flex flex-col rounded-lg bg-muted/40 p-2.5 tablet:hidden">
              {!isMaster && (
                <InfoRow label={labels.name}>{profile.name}</InfoRow>
              )}
              <InfoRow label={labels.id}>{idValue}</InfoRow>
              {isMaster && (
                <InfoRow label={labels.name}>{profile.name}</InfoRow>
              )}
              <InfoRow label={labels.joinedAt}>{joinedAtValue}</InfoRow>
            </div>

            <div className="flex flex-col gap-3 tablet:gap-0">
              {!isMaster && (
                <InfoRow label={labels.name} className={rowClassName}>
                  {profile.name}
                </InfoRow>
              )}
              <InfoRow label={labels.id} className={rowClassName}>
                {idValue}
              </InfoRow>
              <ProfilePasswordFields
                values={values}
                errors={errors}
                onChangeField={handleChangeField}
              />
              {isMaster && (
                <>
                  <InfoRow label={labels.name} className={rowClassName}>
                    {profile.name}
                  </InfoRow>
                  <PhoneVerifyRow
                    phone={profile.phone}
                    verification={phoneVerification}
                    onClickVerify={() =>
                      void startVerification({ email: values.email })
                    }
                  />
                </>
              )}
              <FormRow
                label={labels.email}
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
              <InfoRow label={labels.joinedAt} className={rowClassName}>
                {joinedAtValue}
              </InfoRow>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 p-4 tablet:p-5">
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
