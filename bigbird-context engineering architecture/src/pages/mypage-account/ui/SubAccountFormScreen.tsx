import { SubAccountFormPanel } from "@/features/manage-sub-accounts";
import { cn } from "@/shared/lib/utils";

import type { SubAccountViewModel } from "@/features/manage-sub-accounts";

interface SubAccountFormScreenProps {
  /** tablet은 탭 줄까지 덮는 본문 전체 화면, mobile은 탭 줄 아래 서브 화면(시안). */
  variant: "tablet" | "mobile";
  /** 수정할 Sub ID. 없으면 생성 화면. */
  account?: SubAccountViewModel;
  onClose: () => void;
  onSaved: () => void;
}

// TAB·MO의 Sub ID 생성·수정은 패널이 아니라 화면 폭을 다 쓰는 화면임. 레이아웃 여백(--mypage-gutter)만큼 바깥으로 나가 가장자리까지 채움.
export function SubAccountFormScreen({
  variant,
  account,
  onClose,
  onSaved,
}: SubAccountFormScreenProps) {
  return (
    <div
      className={cn(
        "-mx-(--mypage-gutter) flex flex-col",
        // 본문 높이를 채워 하단 버튼이 화면 바닥에 붙게 함.
        variant === "tablet" && "min-h-full",
        // 서브헤더가 탭 줄 바로 아래에 붙는 시안. 탭 줄과 본문 사이 간격(Tabs의 gap-4)만큼 올림.
        variant === "mobile" && "-mt-4",
      )}
    >
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
