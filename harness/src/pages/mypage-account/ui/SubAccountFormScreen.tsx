import { SubAccountFormPanel } from "@/features/manage-sub-accounts";

import type { SubAccountViewModel } from "@/features/manage-sub-accounts";

interface SubAccountFormScreenProps {
  /** 수정할 Sub ID. 없으면 생성 화면. */
  account?: SubAccountViewModel;
  onClose: () => void;
  onSaved: () => void;
}

// TAB·MO의 Sub ID 생성·수정은 패널이 아니라 탭 줄까지 덮고 화면 폭을 다 쓰는 화면임. 레이아웃 여백(--mypage-gutter)만큼 바깥으로 나가 가장자리까지 채움.
export function SubAccountFormScreen({
  account,
  onClose,
  onSaved,
}: SubAccountFormScreenProps) {
  return (
    // min-h-full: 본문 높이를 채워 하단 버튼이 화면 바닥에 붙게 함.
    <div className="-mx-(--mypage-gutter) flex min-h-full flex-col">
      <SubAccountFormPanel
        // 대상이 바뀌면 이전 Sub ID의 입력값이 남지 않게 새로 그림.
        key={account?.accountIdx ?? "create"}
        account={account}
        onClose={onClose}
        onSaved={onSaved}
      />
    </div>
  );
}
