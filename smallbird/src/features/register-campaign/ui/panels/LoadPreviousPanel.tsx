import { Search } from "lucide-react";
import { useState } from "react";

import { useCopySources } from "@/entities/campaign";
import { EmptyState } from "@/shared/components/empty-state";
import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";
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
import { Input } from "@/shared/ui/input";

import { hasAnyInput } from "../../model/step-completion";
import { useCopyPrevious } from "../../model/use-copy-previous";
import { useRegisterPanel } from "../../model/use-register-panel";
import { useRegisterWizardStore } from "../../model/wizard-context";
import { CopySourceList } from "./CopySourceList";
import { PanelLayout } from "./PanelLayout";

// 이전 캠페인 불러오기(시안 13320:115656, 빈 상태 115789·115800, 덮어쓰기 알럿 133198).
// 같은 서비스·상품 유형 캠페인(등록 중·취소·반려·데모 포함, 서버가 거름)을 검색하고 1개를 골라 불러옴.
// 지금 캠페인에 입력한 값이 있을 때만 덮어쓰기 알럿을 먼저 띄움(P-33 답 전 처리).
export function LoadPreviousPanel() {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const { closePanel } = useRegisterPanel();
  const campaignIdx = useRegisterWizardStore((state) => state.campaignIdx);
  const serviceType = useRegisterWizardStore((state) => state.serviceType);
  const productType = useRegisterWizardStore((state) => state.productType);
  const draft = useRegisterWizardStore((state) => state.draft);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isOverwriteAlertOpen, setIsOverwriteAlertOpen] = useState(false);
  const list = useCopySources({
    serviceType,
    productType,
    excludeCampaignIdx: campaignIdx,
    keyword,
  });
  const { copyFrom, isCopying } = useCopyPrevious({ onCopied: closePanel });

  const isEmpty = !list.isLoading && !list.isError && list.records.length === 0;

  function handleSearch() {
    setKeyword(searchInput.trim());
    setSelectedIdx(null);
  }

  function handleSelect(nextIdx: number) {
    setSelectedIdx((current) => (current === nextIdx ? null : nextIdx));
  }

  function handleClickLoad() {
    if (selectedIdx === null) return;
    if (hasAnyInput(draft)) {
      setIsOverwriteAlertOpen(true);
      return;
    }
    void copyFrom(selectedIdx);
  }

  function handleConfirmOverwrite() {
    setIsOverwriteAlertOpen(false);
    if (selectedIdx !== null) void copyFrom(selectedIdx);
  }

  function renderList() {
    if (list.isError) {
      return (
        <EmptyState
          type="alarm"
          title={t("toast.requestFailed")}
          action={
            <Button variant="outline" onClick={() => void list.reload()}>
              {tCommon("action.retry")}
            </Button>
          }
        />
      );
    }
    if (isEmpty && keyword) {
      return (
        <EmptyState
          type="no-search"
          title={t("loadPrevious.emptySearch", { keyword })}
          className="flex-1 justify-center"
        />
      );
    }
    if (isEmpty) {
      return (
        <EmptyState
          type="no-list"
          title={t("loadPrevious.empty")}
          className="flex-1 justify-center"
        />
      );
    }
    return (
      <>
        <h3 className="ds-text-sm-5-medium">{t("loadPrevious.listTitle")}</h3>
        <CopySourceList
          records={list.records}
          selectedIdx={selectedIdx}
          variant={isDesktop ? "table" : "cards"}
          hasMore={list.hasMore}
          onSelect={handleSelect}
          onReachEnd={list.loadMore}
        />
      </>
    );
  }

  return (
    <PanelLayout
      title={t("loadPrevious.title")}
      onClose={closePanel}
      footer={
        <Button
          className="w-full"
          disabled={selectedIdx === null || isCopying}
          onClick={handleClickLoad}
        >
          {t("loadPrevious.load")}
        </Button>
      }
    >
      <div className="flex min-h-full flex-col gap-3 ds-p-5 pb-0">
        <form
          role="search"
          className="flex gap-2 tablet:gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              className="pl-9"
              aria-label={t("loadPrevious.search.label")}
              placeholder={t("loadPrevious.search.placeholder")}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <Button type="submit" variant="outline">
            {t("loadPrevious.search.submit")}
          </Button>
        </form>
        {renderList()}
      </div>
      <AlertDialog
        open={isOverwriteAlertOpen}
        onOpenChange={setIsOverwriteAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("loadPrevious.overwrite.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("loadPrevious.overwrite.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOverwrite}>
              {t("loadPrevious.overwrite.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PanelLayout>
  );
}
