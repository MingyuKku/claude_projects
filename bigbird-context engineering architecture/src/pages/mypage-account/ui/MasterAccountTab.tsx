import {
  AccountInfoCard,
  AccountInfoCardSkeleton,
  AccountProfileForm,
  AccountProfileFormSkeleton,
} from "@/features/edit-account-profile";
import {
  SocialLinkCard,
  SocialLinkCardSkeleton,
} from "@/features/link-social-account";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";

import { MasterAccountGate } from "./MasterAccountGate";

// Figma Master ID 관리(6925:47198): PC는 기본 정보(가변)와 정보 수정(575)이 한 줄, TAB·MO는 한 열.
const MASTER_GRID_CLASS_NAME =
  "flex flex-col gap-5 desktop:grid desktop:grid-cols-[minmax(0,1fr)_calc(var(--spacing)*143.75)] desktop:gap-x-5 desktop:gap-y-6";

interface MasterAccountTabProps {
  /** 회원 탈퇴 버튼. 약관 화면 열기는 페이지가 소유함(URL 쿼리). */
  onClickWithdraw: () => void;
}

export function MasterAccountTab({ onClickWithdraw }: MasterAccountTabProps) {
  return (
    <MasterAccountGate skeleton={<MasterAccountSkeleton />}>
      {(master, refresh) => (
        // PC는 [기본 정보 | 정보 수정] 한 줄 아래 왼쪽 열에 간편 로그인 연동(시안 10061:200877), TAB·MO는 이 순서대로 한 열.
        <div className={MASTER_GRID_CLASS_NAME}>
          <AccountInfoCard profile={master.profile} />
          <AccountProfileForm
            profile={master.profile}
            onClickWithdraw={onClickWithdraw}
            onSaved={refresh}
          />
          <SocialLinkCard links={master.socialLinks} />
        </div>
      )}
    </MasterAccountGate>
  );
}

// 실제 화면과 같은 그리드라 로딩이 끝나도 카드 위치가 움직이지 않음.
function MasterAccountSkeleton() {
  return (
    <SkeletonGroup className={MASTER_GRID_CLASS_NAME}>
      <AccountInfoCardSkeleton />
      <AccountProfileFormSkeleton />
      <SocialLinkCardSkeleton />
    </SkeletonGroup>
  );
}
