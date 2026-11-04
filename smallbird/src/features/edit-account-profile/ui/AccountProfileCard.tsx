import { useState } from "react";

import { verifyCurrentPassword } from "@/entities/account";
import { PasswordConfirmDialog } from "@/shared/components/password-confirm-dialog";
import { SectionCard } from "@/shared/components/section-card";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import { AccountProfileForm } from "./AccountProfileForm";
import { AccountProfileView } from "./AccountProfileView";

import type { ProfileImageSource } from "../api/use-profile-image";
import type { AccountProfileViewModel } from "@/entities/account";

// 시안 MO는 카드 제목과 카드 사이가 12px, TAB·PC는 16px.
const SECTION_GAP_CLASS_NAME = "gap-3 tablet:gap-4";

interface AccountProfileCardBaseProps {
  profile: AccountProfileViewModel;
  /** 회원 탈퇴 버튼을 보일 때만 넘김(Master). */
  onClickWithdraw?: () => void;
  /** 서버에 하나라도 반영된 뒤 호출. 화면이 정보를 다시 읽음. */
  onSaved: () => void;
  className?: string;
}

/**
 * Master와 Sub ID는 행 구성·저장 API·이미지 출처가 다름. 기본은 Master(이미지는 카드가 `GET /profile`로 읽음).
 * Sub ID는 본인 정보(`GET /sub/self`)에 담겨 온 이미지를 넘김.
 */
type AccountProfileCardProps = AccountProfileCardBaseProps &
  (
    | { accountType?: "master" }
    | { accountType: "sub"; profileImageUrl: string | null }
  );

function toImageSource(props: AccountProfileCardProps): ProfileImageSource {
  return props.accountType === "sub"
    ? { accountType: "sub", url: props.profileImageUrl }
    : { accountType: "master" };
}

// 기본 정보 카드(Master Figma 10724:185324·185548, Sub ID 10724:185444·185610): 보기 → "수정" → 관리자 비밀번호 확인 → 같은 카드가 입력 모드 → 취소·저장.
// Master는 비밀번호 확인을 수정에 들어갈 때마다 다시 물음(스펙 §3, 화면마다 따로). Sub ID 본인 정보는 확인 없이 바로 수정 모드로 들어감(사용자 결정).
export function AccountProfileCard(props: AccountProfileCardProps) {
  const { profile, onClickWithdraw, onSaved, className } = props;
  const { t } = useTranslation("features/edit-account-profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const imageSource = toImageSource(props);
  const { accountType } = imageSource;
  const isPasswordRequired = accountType === "master";

  function handleClickEdit() {
    if (isPasswordRequired) setIsConfirming(true);
    else setIsEditing(true);
  }

  if (isEditing) {
    return (
      <AccountProfileForm
        accountType={accountType}
        profile={profile}
        imageSource={imageSource}
        onClickWithdraw={onClickWithdraw}
        onSaved={onSaved}
        onFinishEdit={() => setIsEditing(false)}
        className={cn(SECTION_GAP_CLASS_NAME, className)}
      />
    );
  }

  return (
    <SectionCard
      title={t("info.title")}
      className={cn(SECTION_GAP_CLASS_NAME, className)}
    >
      <AccountProfileView
        accountType={accountType}
        profile={profile}
        imageSource={imageSource}
        onClickEdit={handleClickEdit}
        onClickWithdraw={onClickWithdraw}
      />
      {isPasswordRequired && (
        <PasswordConfirmDialog
          open={isConfirming}
          onSubmit={verifyCurrentPassword}
          onConfirmed={() => {
            setIsConfirming(false);
            setIsEditing(true);
          }}
          onClose={() => setIsConfirming(false)}
        />
      )}
    </SectionCard>
  );
}
