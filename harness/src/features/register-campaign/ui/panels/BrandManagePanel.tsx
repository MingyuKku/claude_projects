import { Plus, Trash } from "lucide-react";
import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import { deleteBrand, useBrands } from "@/entities/brand";
import { EmptyState } from "@/shared/components/empty-state";
import { Trans, useTranslation } from "@/shared/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import { useRegisterPanel } from "../../model/use-register-panel";
import { useRegisterWizardStore } from "../../model/wizard-context";
import { PanelLayout } from "./PanelLayout";

import type { Brand } from "@/entities/brand";

// 브랜드 관리 목록(시안 13320:115433, 빈 상태 115837). 행마다 "삭제" → 확인 알럿(13320:133199) → 서버에서 지우고 목록을
// 다시 읽음. 지금 1단계에서 고른 브랜드를 지우면 선택을 비움. 행을 눌러 고르는 동작은 시안에 없어 두지 않음(스펙 §3 1단계).
export function BrandManagePanel() {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const { brands, mutate } = useBrands();
  const { openPanel, closePanel } = useRegisterPanel();
  const selectedBrandIdx = useRegisterWizardStore(
    (state) => state.draft.info.brandIdx,
  );
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isEmpty = brands?.length === 0;

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const [error] = await tryit(deleteBrand)(deleteTarget.brandIdx);
    setIsDeleting(false);
    setDeleteTarget(null);
    if (error) {
      toast.error(t("toast.saveFailed"));
      return;
    }
    if (deleteTarget.brandIdx === selectedBrandIdx) {
      patchStepDraft("info", { brandIdx: null });
    }
    void mutate();
  }

  return (
    <PanelLayout
      title={t("brands.title")}
      onClose={closePanel}
      footer={
        <Button className="w-full" onClick={() => openPanel("add-brand")}>
          <Plus aria-hidden />
          {t("brands.add")}
        </Button>
      }
    >
      {isEmpty ? (
        <EmptyState
          type="no-list"
          title={t("brands.empty")}
          className="h-full justify-center"
        />
      ) : (
        <section className="flex flex-col ds-gap-4 ds-p-5 pb-0">
          <div className="flex items-center justify-between">
            <h3 className="ds-text-base-none-semibold">
              {t("brands.listTitle")}
            </h3>
            <p className="ds-text-sm-none-medium">
              <Trans
                t={t}
                i18nKey="brands.count"
                count={brands?.length ?? 0}
                components={{ em: <span className="text-primary" /> }}
              />
            </p>
          </div>
          <ul className="overflow-hidden rounded-md border">
            {brands?.map((brand) => (
              <li
                key={brand.brandIdx}
                className="flex h-14 items-center gap-3 border-b px-4 last:border-b-0 desktop:hover:bg-muted/40"
              >
                <span className="min-w-0 flex-1 truncate ds-text-sm-5-normal">
                  {brand.name}
                </span>
                <Button
                  variant="outline-foreground"
                  aria-label={t("brands.deleteLabel", { name: brand.name })}
                  onClick={() => setDeleteTarget(brand)}
                >
                  <Trash aria-hidden />
                  {t("brands.delete")}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(isOpen) => !isOpen && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("brands.deleteDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("brands.deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              destructive
              disabled={isDeleting}
              onClick={(event) => {
                // 지우는 동안 알럿을 열어 두고, 끝나면 닫음.
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              {t("brands.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PanelLayout>
  );
}
