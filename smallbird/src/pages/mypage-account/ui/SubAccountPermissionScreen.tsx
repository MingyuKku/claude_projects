import { SubAccountPermissionPanel } from "@/features/manage-sub-accounts";

interface SubAccountPermissionScreenProps {
  accountIdx: number;
  onClose: () => void;
}

// MO의 권한 부여는 탭 줄까지 덮는 전체 화면(서브헤더 "Sub ID 권한부여" + X, 시안 10724:187964, QA 2026-11-10: 탭 줄 없음).
// 레이아웃 여백(--mypage-gutter)만큼 나가 가장자리까지 채우고, 본문 높이를 채워 하단 버튼이 화면 바닥에 붙게 함.
export function SubAccountPermissionScreen({
  accountIdx,
  onClose,
}: SubAccountPermissionScreenProps) {
  return (
    <div className="-mx-(--mypage-gutter) flex min-h-full flex-col">
      <SubAccountPermissionPanel accountIdx={accountIdx} onClose={onClose} />
    </div>
  );
}
