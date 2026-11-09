import { tryit } from "radash";
import { toast } from "sonner";

import { isSimpleSuccess } from "@/entities/account";
import {
  CreateSubAccountButton,
  DeleteSubAccountDialog,
  SubAccountFormPanel,
  SubAccountList,
  SubAccountPermissionPanel,
  useDeleteSubAccount,
  useSubAccount,
} from "@/features/manage-sub-accounts";
import { useTranslation } from "@/shared/i18n";
import { useDialogTarget } from "@/shared/lib";

import { SubAccountFormScreen } from "./SubAccountFormScreen";
import { SubAccountPermissionScreen } from "./SubAccountPermissionScreen";

import type { SubAccountViewModel } from "@/features/manage-sub-accounts";

export type SubAccountLayout = "desktop" | "tablet" | "mobile";

/** Sub ID 관리의 하위 화면. 쿼리 `panel` 값과 같음. */
export type SubAccountPanelName = "create" | "permission" | "edit";

interface SubAccountTabProps {
  /** 화면 크기에 따른 하위 화면 배치. PC는 오른쪽 패널, TAB은 생성·수정을 페이지가 본문 전체로 그리고 권한 부여는 목록 자리의 카드, MO는 탭 아래 화면. */
  layout: SubAccountLayout;
  /** 열려 있는 하위 화면. 없으면 목록만. */
  panel: SubAccountPanelName | null;
  /** 권한 부여·수정을 연 Sub ID(쿼리 `subId`). */
  panelAccountIdx: number | null;
  onOpenCreate: () => void;
  onOpenPermission: (account: SubAccountViewModel) => void;
  onOpenEdit: (account: SubAccountViewModel) => void;
  onClosePanel: () => void;
}

export function SubAccountTab({
  layout,
  panel,
  panelAccountIdx,
  onOpenCreate,
  onOpenPermission,
  onOpenEdit,
  onClosePanel,
}: SubAccountTabProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const { t: tCommon } = useTranslation();
  const deleteDialog = useDialogTarget<SubAccountViewModel>();
  const deleteSubAccount = useDeleteSubAccount();

  // 지금 보이는 목록에 있는 Sub ID만 엶(지워졌거나 주소를 고친 subId는 열지 않음).
  const panelAccount = useSubAccount(panelAccountIdx);
  const openedAccount = panel === "create" ? null : panelAccount;
  const openedPanel =
    panel === "create" || (panel !== null && openedAccount !== null)
      ? panel
      : null;
  const openedAccountIdx = openedAccount?.accountIdx ?? null;

  async function handleDelete(account: SubAccountViewModel) {
    const [error, response] = await tryit(deleteSubAccount)(account.accountIdx);
    if (error || !isSimpleSuccess(response)) {
      toast.error(tCommon("feedback.saveFailed"));
      return;
    }
    toast(t("delete.toast.deleted"));
    // 지운 Sub ID의 권한 부여·수정을 열어 둔 상태면 닫음.
    if (account.accountIdx === openedAccountIdx) onClosePanel();
  }

  if (layout === "mobile" && openedPanel === "permission" && openedAccount) {
    return (
      <SubAccountPermissionScreen
        accountIdx={openedAccount.accountIdx}
        onClose={onClosePanel}
      />
    );
  }

  if (
    layout === "mobile" &&
    (openedPanel === "create" || openedPanel === "edit")
  ) {
    return (
      <SubAccountFormScreen
        variant="mobile"
        account={openedAccount ?? undefined}
        onClose={onClosePanel}
        onSaved={onClosePanel}
      />
    );
  }

  // TAB의 권한 부여는 목록 자리를 덮는 본문 전체 카드(시안 10724:187263). 탭 줄은 그대로 보임.
  if (layout === "tablet" && openedPanel === "permission" && openedAccount) {
    return (
      <div className="flex flex-col overflow-hidden rounded-lg border">
        <SubAccountPermissionPanel
          key={openedAccount.accountIdx}
          accountIdx={openedAccount.accountIdx}
          onBack={onClosePanel}
          onClose={onClosePanel}
          campaignClassName="grid-cols-2"
        />
      </div>
    );
  }

  const isPanelBeside = layout === "desktop" && openedPanel !== null;

  return (
    // 목록이 짧아도 MO는 생성 버튼이 화면 맨 아래에 붙고, 빈 상태는 남은 높이를 채우도록 탭 본문 높이를 채움(MyPageAccountPage의 min-h-full 체인).
    <div className="flex flex-1 items-stretch gap-5">
      <div className="flex min-w-0 flex-1 flex-col gap-4 tablet:gap-6">
        <SubAccountList
          activeAccountIdx={openedAccountIdx}
          onClickCreate={onOpenCreate}
          onClickPermission={onOpenPermission}
          onClickEdit={onOpenEdit}
          onClickDelete={deleteDialog.open}
        />
        {/* MO는 생성 버튼을 화면 아래에 고정함(시안 Footer). 스크롤 컨테이너(<main>) 안에서 sticky로 붙여 키보드 대응 JS 없이
            처리하고, 목록 끝이 버튼에 가리지 않게 함. 화면 좌우 끝까지 채우도록 레이아웃 여백(--mypage-gutter)만큼 나감. */}
        <div className="sticky bottom-0 -mx-(--mypage-gutter) mt-auto border-t bg-background px-(--mypage-gutter) py-4 tablet:hidden">
          <CreateSubAccountButton className="w-full" onClick={onOpenCreate} />
        </div>
      </div>
      <DeleteSubAccountDialog
        open={deleteDialog.isOpen}
        account={deleteDialog.target}
        onCancel={deleteDialog.close}
        onConfirm={(account) => {
          deleteDialog.close();
          void handleDelete(account);
        }}
      />
      {isPanelBeside && (
        // 고객센터 상세 패널과 같은 인라인 패널(시안 377×640, 딤 없음). 생성·수정·권한 부여가 같은 자리를 씀.
        // 높이는 640이되 낮은 창에서는 헤더·탭 줄 아래 간격(--account-tabs-offset)·아래 여백(20)을 뺀 남은 높이로 줄어들고(안쪽은 스크롤),
        // 목록보다 낮아진 패널은 스크롤해도 탭 줄 아래에 고정되어 위로 밀려 올라가지 않음.
        <aside className="sticky top-(--account-tabs-offset) flex h-160 max-h-[calc(100dvh-var(--app-header-height)-var(--account-tabs-offset)-var(--spacing)*5)] w-94.25 shrink-0 flex-col self-start overflow-hidden rounded-lg border">
          {openedPanel === "permission" && openedAccount ? (
            <SubAccountPermissionPanel
              key={openedAccount.accountIdx}
              accountIdx={openedAccount.accountIdx}
              onClose={onClosePanel}
            />
          ) : (
            <SubAccountFormPanel
              key={openedAccount?.accountIdx ?? "create"}
              account={openedAccount ?? undefined}
              onClose={onClosePanel}
              onSaved={onClosePanel}
            />
          )}
        </aside>
      )}
    </div>
  );
}
