import { formatPhoneNumber } from "@/entities/account";
import { InfoRow } from "@/shared/components/info-row";
import { useTranslation } from "@/shared/i18n";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";

import { useProfileImage } from "../api/use-profile-image";
import { formatJoinedAt } from "../lib/format-joined-at";
import { PASSWORD_MASK } from "../model/constants";

import type { ProfileImageSource } from "../api/use-profile-image";
import type { AccountRole } from "../lib/save-account-profile";
import type { AccountProfileViewModel } from "@/entities/account";

interface AccountProfileViewProps {
  /** Sub ID는 시안의 라벨·행 구성이 다름(휴대폰 번호 행 없음). 기본은 Master. */
  accountType?: AccountRole;
  profile: AccountProfileViewModel;
  imageSource: ProfileImageSource;
  onClickEdit: () => void;
  /** 회원 탈퇴 버튼을 보일 때만 넘김(Master). */
  onClickWithdraw?: () => void;
}

// Figma 기본 정보 보기(10724:185324): 읽기 전용 행과 아래 "회원 탈퇴"·"수정". 수정은 비밀번호 확인 뒤 입력 모드로 바뀜.
export function AccountProfileView({
  accountType = "master",
  profile,
  imageSource,
  onClickEdit,
  onClickWithdraw,
}: AccountProfileViewProps) {
  const { t } = useTranslation("features/edit-account-profile");
  const { t: tCommon } = useTranslation();
  const { profileUrl } = useProfileImage(imageSource);
  const isMaster = accountType === "master";

  return (
    <>
      <div className="flex flex-col p-4 tablet:p-5">
        <dl className="flex min-h-12 items-start gap-2 px-4">
          <dt className="shrink-0 text-sm leading-5 font-semibold text-foreground tablet:min-w-0 tablet:flex-1">
            {t("form.profileImage.label")}
          </dt>
          <dd className="flex flex-1 justify-end tablet:min-w-0">
            <Avatar size="5xl">
              {profileUrl && (
                <AvatarImage
                  src={profileUrl}
                  alt={t("form.profileImage.alt")}
                />
              )}
              <AvatarPlaceholder />
            </Avatar>
          </dd>
        </dl>
        {isMaster ? (
          <>
            <InfoRow label={t("info.id")}>{profile.identifier}</InfoRow>
            <InfoRow label={t("info.password")}>{PASSWORD_MASK}</InfoRow>
            <InfoRow label={t("info.name")}>{profile.name}</InfoRow>
            <InfoRow label={t("info.phone")}>
              {formatPhoneNumber(profile.phone)}
            </InfoRow>
            <InfoRow label={t("info.email")}>{profile.email}</InfoRow>
            <InfoRow label={t("info.joinedAt")}>
              {formatJoinedAt(profile.joinedAt)}
            </InfoRow>
          </>
        ) : (
          <>
            <InfoRow label={t("sub.name")}>{profile.name}</InfoRow>
            <InfoRow label={t("sub.id")}>{profile.identifier}</InfoRow>
            <InfoRow label={t("info.password")}>{PASSWORD_MASK}</InfoRow>
            <InfoRow label={t("sub.email")}>{profile.email}</InfoRow>
            <InfoRow label={t("sub.joinedAt")}>
              {formatJoinedAt(profile.joinedAt)}
            </InfoRow>
          </>
        )}
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
        <Button type="button" variant="outline" onClick={onClickEdit}>
          {tCommon("action.edit")}
        </Button>
      </div>
    </>
  );
}
