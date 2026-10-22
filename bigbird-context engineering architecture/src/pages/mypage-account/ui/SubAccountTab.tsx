import { useState } from "react";
import { toast } from "sonner";

import {
  CreateSubAccountButton,
  CreateSubAccountPanel,
  DeleteSubAccountDialog,
  SubAccountList,
  SubAccountPermissionSections,
  useSubAccount,
} from "@/features/manage-sub-accounts";
import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";

import { CreateSubAccountScreen } from "./CreateSubAccountScreen";
import { SubAccountPermissionScreen } from "./SubAccountPermissionScreen";

import type { SubAccountViewModel } from "@/features/manage-sub-accounts";

export type SubAccountLayout = "desktop" | "tablet" | "mobile";

interface SubAccountTabProps {
  /** 화면 크기에 따른 하위 화면 배치. PC는 오른쪽 패널, TAB은 페이지가 본문 전체로 그리고, MO는 탭 아래 화면. */
  layout: SubAccountLayout;
  isCreateOpen: boolean;
  onOpenCreate: () => void;
  onCloseCreate: () => void;
  /** 권한 부여를 연 Sub ID(쿼리 `subId`). 없으면 닫힌 상태. */
  permissionAccountIdx: number | null;
  onOpenPermission: (account: SubAccountViewModel) => void;
  onClosePermission: () => void;
}

export function SubAccountTab({
  layout,
  isCreateOpen,
  onOpenCreate,
  onCloseCreate,
  permissionAccountIdx,
  onOpenPermission,
  onClosePermission,
}: SubAccountTabProps) {
  const { t: tCommon } = useTranslation();
  const notifyComingSoon = () => toast(tCommon("status.comingSoon"));
  const [deleteTarget, setDeleteTarget] = useState<SubAccountViewModel | null>(
    null,
  );

  // 목록·권한 조회 API가 없어 개발 서버에서만 목으로 그리고, 빌드(stage·prod)에서는 목록 자리에 "준비 중"을 보임(스펙 §1).
  // 생성은 실제 API라 빌드에서도 둠.
  const isMockDataEnabled = import.meta.env.DEV;
  const permissionAccount = useSubAccount(
    isMockDataEnabled ? permissionAccountIdx : null,
  );
  const isPermissionOpen = permissionAccount !== null;

  if (isPermissionOpen && layout === "mobile") {
    return <SubAccountPermissionScreen onClose={onClosePermission} />;
  }

  if (isCreateOpen && layout === "mobile") {
    return (
      <CreateSubAccountScreen
        variant="mobile"
        onClose={onCloseCreate}
        onCreated={onCloseCreate}
      />
    );
  }

  const isPanelBeside = isCreateOpen && layout === "desktop";

  return (
    <div className="flex items-start gap-5">
      <div className="flex min-w-0 flex-1 flex-col gap-4 tablet:gap-6">
        {isMockDataEnabled ? (
          <SubAccountList
            activeAccountIdx={permissionAccount?.accountIdx ?? null}
            onClickCreate={onOpenCreate}
            onClickPermission={onOpenPermission}
            onClickDelete={setDeleteTarget}
          />
        ) : (
          <SubAccountListComingSoon onClickCreate={onOpenCreate} />
        )}
        {/* MO는 생성 버튼을 화면 아래에 고정함(시안 Footer). 스크롤 컨테이너(<main>) 안에서 sticky로 붙여 키보드 대응 JS 없이
            처리하고, 목록 끝이 버튼에 가리지 않게 함. 화면 좌우 끝까지 채우도록 레이아웃 여백(--mypage-gutter)만큼 나감. */}
        {/* PC·TAB은 목록 아래에 권한 부여 두 섹션을 엶. */}
        {isPermissionOpen && (
          <div className="hidden tablet:block">
            <SubAccountPermissionSections />
          </div>
        )}
        <div className="sticky bottom-0 -mx-(--mypage-gutter) border-t bg-background px-(--mypage-gutter) py-4 tablet:hidden">
          <CreateSubAccountButton className="w-full" onClick={onOpenCreate} />
        </div>
      </div>
      {/* 확인 알럿까지는 시안대로 진행하고, 마지막 서버 단계는 목록이 목인 동안 준비 중으로 막음. 목 ID(예: 9000~)로
          실제 DELETE를 부르면 같은 번호의 진짜 계정이 지워질 수 있음(사용자 결정). 목록 API가 나오면 실제 삭제로 바꿈. */}
      <DeleteSubAccountDialog
        account={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          setDeleteTarget(null);
          notifyComingSoon();
        }}
      />
      {isPanelBeside && (
        // 고객센터 상세 패널과 같은 인라인 패널(시안 377×640, 딤 없음).
        <aside className="flex h-160 w-94.25 shrink-0 flex-col overflow-hidden rounded-lg border">
          <CreateSubAccountPanel
            onClose={onCloseCreate}
            onCreated={onCloseCreate}
          />
        </aside>
      )}
    </div>
  );
}

/** 목록 API 공개 전 빌드 화면: PC·TAB 생성 버튼(MO는 하단 고정 버튼) + "준비 중" */
function SubAccountListComingSoon({
  onClickCreate,
}: {
  onClickCreate: () => void;
}) {
  const { t: tCommon } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="hidden justify-end tablet:flex">
        <CreateSubAccountButton onClick={onClickCreate} />
      </div>
      <EmptyState
        type="construction"
        title={tCommon("status.comingSoon")}
        className="py-20"
      />
    </div>
  );
}
