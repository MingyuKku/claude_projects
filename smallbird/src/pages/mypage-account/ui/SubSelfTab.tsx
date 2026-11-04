import { useSubSelfAccount } from "@/entities/account";
import {
  AccountInfoCardSkeleton,
  AccountProfileCard,
} from "@/features/edit-account-profile";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";

import { LoadFailedState } from "./LoadFailedState";

// Sub ID 본인 화면("Sub ID 관리" 탭, Figma 10724:185444·185610): Master와 같은 보기·수정 카드 한 장이고 간편 로그인 연동·회원 탈퇴는 없음(스펙 §3).
// 저장은 Sub 전용 API(/sub/pw·/sub/email·/sub/profile)로 보냄.
export function SubSelfTab() {
  const { account, isLoading, isError, mutate } = useSubSelfAccount();

  if (isLoading) {
    return (
      <SkeletonGroup>
        <AccountInfoCardSkeleton />
      </SkeletonGroup>
    );
  }

  if (isError || !account) {
    return <LoadFailedState onRetry={() => void mutate()} />;
  }

  return (
    <AccountProfileCard
      accountType="sub"
      profile={account.profile}
      profileImageUrl={account.profileImageUrl}
      onSaved={() => void mutate()}
    />
  );
}
