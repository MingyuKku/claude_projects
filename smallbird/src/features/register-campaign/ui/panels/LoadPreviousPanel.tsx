import { useState } from "react";

import { InfiniteScrollSentinel } from "@/shared/components/infinite-list";
import { SearchInput } from "@/shared/components/search-input";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

import { hasAnyInput } from "../../lib/draft-input";
import { useCampaignRegisterStore } from "../../model/store-context";
import { useLoadPreviousCampaign } from "../../model/use-load-previous-campaign";
import { usePreviousCampaigns } from "../../model/use-previous-campaigns";
import { useWizardPanel } from "../../model/use-wizard-panel";
import { LoadPreviousOverwriteAlert } from "./LoadPreviousOverwriteAlert";
import { PanelBody, PanelFooter } from "./PanelLayout";
import { PreviousCampaignCards } from "./previous/PreviousCampaignCards";
import { PreviousCampaignTable } from "./previous/PreviousCampaignTable";

// 이전 캠페인 불러오기(Figma 7555:333792 PC 드로어, 7555:355174 TAB·7555:420882 MO 서브 화면):
// 검색(캠페인명 또는 브랜드명, "검색" 버튼이나 Enter로 실행) → 목록(한 개만 선택) → 하단 "캠페인 불러오기".
// 목록이 0건이거나 검색 결과가 없을 때의 시안이 없어 목록 영역을 비워 둠(스펙 P-9).
interface LoadPreviousPanelProps {
  onClose: () => void;
}

export function LoadPreviousPanel({ onClose }: LoadPreviousPanelProps) {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const { isDrawer } = useWizardPanel();
  const serviceType = useCampaignRegisterStore(
    (state) => state.draft.serviceType,
  );
  const campaignIdx = useCampaignRegisterStore(
    (state) => state.draft.campaignIdx,
  );
  const draft = useCampaignRegisterStore((state) => state.draft);
  const [draftKeyword, setDraftKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedCampaignIdx, setSelectedCampaignIdx] = useState<number | null>(
    null,
  );
  const list = usePreviousCampaigns({
    serviceType,
    excludeCampaignIdx: campaignIdx,
    keyword,
  });

  const { isLoading: isLoadingPrevious, loadPrevious } =
    useLoadPreviousCampaign({
      onLoaded: onClose,
      onSourceNotFound: () => void list.reload(),
    });
  const [isOverwriteAlertOpen, setIsOverwriteAlertOpen] = useState(false);

  // 지금 입력한 값이 하나라도 있으면 덮어쓰기를 먼저 확인하고, 없으면 바로 불러옴.
  function handleClickLoad() {
    if (selectedCampaignIdx === null) return;
    if (hasAnyInput(draft)) {
      setIsOverwriteAlertOpen(true);
      return;
    }
    void loadPrevious(selectedCampaignIdx);
  }

  function handleConfirmOverwrite() {
    setIsOverwriteAlertOpen(false);
    if (selectedCampaignIdx !== null) void loadPrevious(selectedCampaignIdx);
  }

  function handleSubmitSearch(event: React.SyntheticEvent) {
    event.preventDefault();
    setKeyword(draftKeyword.trim());
    // 검색 결과에 없는 캠페인이 선택된 채 남지 않게 함.
    setSelectedCampaignIdx(null);
  }

  return (
    <>
      <PanelBody className="gap-3 tablet:gap-3">
        <form onSubmit={handleSubmitSearch} className="flex items-center gap-3">
          <SearchInput
            variant="filled"
            aria-label={t("loadPrevious.searchPlaceholder")}
            placeholder={t("loadPrevious.searchPlaceholder")}
            value={draftKeyword}
            onChange={(event) => setDraftKeyword(event.target.value)}
          />
          <Button type="submit" variant="outline" className="shrink-0">
            {t("loadPrevious.search")}
          </Button>
        </form>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm leading-5 font-medium text-foreground">
            {t("loadPrevious.listTitle")}
          </h3>
          {list.isLoading && (
            <div className="flex justify-center py-6">
              <Spinner
                aria-label={tCommon("status.loading")}
                className="size-5 text-primary"
              />
            </div>
          )}
          {list.isError && (
            <div className="flex flex-col items-center gap-3 py-6 text-sm text-muted-foreground">
              <p>{tCommon("error.unexpected")}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void list.reload()}
              >
                {tCommon("action.retry")}
              </Button>
            </div>
          )}
          {isDrawer ? (
            <PreviousCampaignTable
              campaigns={list.records}
              selectedCampaignIdx={selectedCampaignIdx}
              onSelect={setSelectedCampaignIdx}
            />
          ) : (
            <PreviousCampaignCards
              campaigns={list.records}
              selectedCampaignIdx={selectedCampaignIdx}
              onSelect={setSelectedCampaignIdx}
            />
          )}
          {list.hasMore && (
            <InfiniteScrollSentinel
              key={list.records.length}
              onReach={list.loadMore}
            />
          )}
        </div>
      </PanelBody>
      <PanelFooter>
        <Button
          type="button"
          className="h-9.5 w-full desktop:h-10"
          disabled={selectedCampaignIdx === null || isLoadingPrevious}
          onClick={handleClickLoad}
        >
          {t("loadPrevious.submit")}
        </Button>
      </PanelFooter>
      <LoadPreviousOverwriteAlert
        open={isOverwriteAlertOpen}
        onCancel={() => setIsOverwriteAlertOpen(false)}
        onConfirm={handleConfirmOverwrite}
      />
    </>
  );
}
