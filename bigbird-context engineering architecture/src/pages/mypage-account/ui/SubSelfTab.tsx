import { useSubSelfAccount } from "@/entities/account";
import {
  AccountInfoCard,
  AccountProfileForm,
} from "@/features/edit-account-profile";

// Sub ID 본인 화면("Sub ID 관리" 탭)은 Master ID 관리에서 간편 로그인 연동 카드와 회원 탈퇴만 뺀 구성(스펙 §3).
// 저장은 Sub 전용 API(/sub/pw·/sub/email·/sub/profile)로 보내고, 조회만 API가 없어 목.
export function SubSelfTab() {
  const { profile, refresh } = useSubSelfAccount();

  return (
    <div className="flex flex-col gap-5 desktop:grid desktop:grid-cols-[minmax(0,1fr)_calc(var(--spacing)*143.75)] desktop:gap-x-5">
      <AccountInfoCard profile={profile} />
      <AccountProfileForm
        accountType="sub"
        profile={profile}
        onSaved={refresh}
      />
    </div>
  );
}
