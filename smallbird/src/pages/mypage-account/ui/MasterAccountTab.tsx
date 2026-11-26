import { useEffect } from "react";

import { useSocialLinks } from "@/entities/account";
import {
  AccountInfoCardSkeleton,
  AccountProfileCard,
} from "@/features/edit-account-profile";
import {
  SocialLinkCard,
  SocialLinkCardSkeleton,
} from "@/features/link-social-account";
import {
  preloadAppleSdk,
  startAppleLink,
  startGoogleLink,
  startKakaoLink,
  startNaverLink,
} from "@/features/social-login";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";

import { LoadFailedState } from "./LoadFailedState";
import { MasterAccountGate } from "./MasterAccountGate";

// PC에서는 두 카드의 높이를 맞춤. 기본 정보가 보기 ↔ 수정으로 높이가 바뀌어도 오른쪽 카드가 따라감.
const MASTER_GRID_CLASS_NAME =
  "flex flex-col ds-gap-5 desktop:grid desktop:grid-cols-2";

// 연결(켜기)을 지원하는 SNS. 카카오·네이버·구글은 공급자 화면으로 옮겼다가 돌아와 이어 가고, 애플은 팝업에서 받은 인가 코드로 바로 연결함.
const SOCIAL_LINK_REQUESTERS = {
  kakao: startKakaoLink,
  naver: startNaverLink,
  google: startGoogleLink,
  apple: startAppleLink,
};

interface MasterAccountTabProps {
  /** 회원 탈퇴 버튼. 약관 화면 열기는 페이지가 소유함(URL 쿼리). */
  onClickWithdraw: () => void;
}

export function MasterAccountTab({ onClickWithdraw }: MasterAccountTabProps) {
  return (
    <MasterAccountGate skeleton={<MasterAccountSkeleton />}>
      {(master, refresh) => (
        <div className={MASTER_GRID_CLASS_NAME}>
          <AccountProfileCard
            profile={master.profile}
            onClickWithdraw={onClickWithdraw}
            onSaved={refresh}
          />
          <SocialLinkSection />
        </div>
      )}
    </MasterAccountGate>
  );
}

// 연결 상태는 Master 정보와 다른 API(`GET /account/sns`)라 따로 읽음. 실패해도 기본 정보는 그대로 보임.
function SocialLinkSection() {
  const { links, isLoading, isError, mutate } = useSocialLinks(true);

  // 애플 팝업은 클릭 직후에 열려야 브라우저가 막지 않아 SDK를 미리 불러 둠. 실패는 켤 때 다시 시도해 알림.
  useEffect(() => {
    preloadAppleSdk().catch(() => undefined);
  }, []);

  // 그리드 칸을 채워야 왼쪽 카드와 높이가 맞음.
  if (isLoading) {
    return (
      <SkeletonGroup className="grid min-w-0">
        <SocialLinkCardSkeleton />
      </SkeletonGroup>
    );
  }

  if (isError || !links) {
    return <LoadFailedState onRetry={() => void mutate()} />;
  }

  return (
    <SocialLinkCard
      links={links}
      onChangeLinks={(next) => void mutate(next, { revalidate: false })}
      linkRequesters={SOCIAL_LINK_REQUESTERS}
    />
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
