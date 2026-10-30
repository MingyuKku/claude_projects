import {
  AccountInfoCardSkeleton,
  AccountProfileCard,
} from "@/features/edit-account-profile";
import {
  SocialLinkCard,
  SocialLinkCardSkeleton,
} from "@/features/link-social-account";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";

import { MasterAccountGate } from "./MasterAccountGate";

// Figma Master ID 관리(10724:185324): PC는 기본 정보와 간편 로그인 연동이 같은 너비로 한 줄(위쪽 정렬), TAB·MO는 한 열.
const MASTER_GRID_CLASS_NAME =
  "flex flex-col gap-5 desktop:grid desktop:grid-cols-2 desktop:items-start desktop:gap-x-5";

interface MasterAccountTabProps {
  /** 회원 탈퇴 버튼. 약관 화면 열기는 페이지가 소유함(URL 쿼리). */
  onClickWithdraw: () => void;
}

export function MasterAccountTab({ onClickWithdraw }: MasterAccountTabProps) {
  return (
    <MasterAccountGate skeleton={<MasterAccountSkeleton />}>
      {(master, refresh) => (
        // 기본 정보는 보기 ↔ 수정을 한 카드가 오가고(시안 10724:185324·185548), 오른쪽(TAB·MO는 아래)에 간편 로그인 연동.
        <div className={MASTER_GRID_CLASS_NAME}>
          <AccountProfileCard
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
      <SocialLinkCardSkeleton />
    </SkeletonGroup>
  );
}
