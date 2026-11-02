import { SubAccountPermissionPanel } from "@/features/manage-sub-accounts";

interface SubAccountPermissionScreenProps {
  accountIdx: number;
  onClose: () => void;
}

// MO의 권한 부여는 탭 줄 아래 서브 화면(서브헤더 "Sub ID 권한부여" + X, 시안 10724:187964). 레이아웃 여백(--mypage-gutter)만큼 나가
// 가장자리까지 채우고, 서브헤더가 탭 줄 바로 아래에 붙도록 Tabs의 gap(16px)만큼 올림.
export function SubAccountPermissionScreen({
  accountIdx,
  onClose,
}: SubAccountPermissionScreenProps) {
  return (
    <div className="-mx-(--mypage-gutter) -mt-4 flex flex-col">
      <SubAccountPermissionPanel accountIdx={accountIdx} onClose={onClose} />
    </div>
  );
}
