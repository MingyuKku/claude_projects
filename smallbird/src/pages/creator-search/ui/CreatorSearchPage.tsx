import { useState } from "react";
import { useOutletContext } from "react-router";

import {
  CreatorFullScreen,
  CreatorList,
  CreatorSelectionBar,
  CreatorToolbar,
  SEARCH_SORTS,
  useCreatorSearch,
  useMatchingCategories,
  useMatchingPlatforms,
  useRowSelection,
  useCreatorTerms,
} from "@/entities/creator";
import {
  BasicFilterPanel,
  BasicFilterSelects,
  DetailFilterPanel,
  DetailFilterSheet,
  EMPTY_COST_FILTER,
  EMPTY_DETAIL_FILTER,
  hasDetailFilter,
  sortPlatformsByMenu,
} from "@/features/filter-creators";
import {
  RecommendAssistant,
  RecommendAssistantButton,
  RecommendAssistantFullScreen,
} from "@/features/recommend-creators";
import { EmptyState } from "@/shared/components/empty-state";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";
import { CreatorOverlays, useCreatorOverlays } from "@/widgets/creator-detail";

import { useSearchPageParams } from "../model/use-search-params";

import type { CreatorListView, MatchingPlatform } from "@/entities/creator";
import type { SessionViewModel } from "@/entities/session";
import type {
  BasicFilterValue,
  DetailFilterValue,
} from "@/features/filter-creators";

type FilterPanel = "basic" | "detail" | "assistant";

// 정렬 화면이 시안에 없어 서버 기본(팔로워 많은 순)으로 고정함.
const DEFAULT_SORT = SEARCH_SORTS[0];

// 검색어·플랫폼·카테고리는 주소 쿼리가 소유하고, 상세 필터는 화면 상태로 둠.
export function CreatorSearchPage() {
  const { t } = useTranslation("pages/creator-search");
  const { term } = useCreatorTerms();
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const session = useOutletContext<SessionViewModel>();
  const params = useSearchPageParams();
  const platformOptions = useMatchingPlatforms();
  const categoryOptions = useMatchingCategories();
  const [detailFilter, setDetailFilter] =
    useState<DetailFilterValue>(EMPTY_DETAIL_FILTER);
  const [cost, setCost] = useState(EMPTY_COST_FILTER);
  const [openPanel, setOpenPanel] = useState<FilterPanel | null>(null);

  const platforms = sortPlatformsByMenu(platformOptions.platforms);
  // 주소에 없거나 모르는 값이면 전체 플랫폼.
  const platform = platforms.find((item) => item.code === params.platformCode);
  const categoryIdxs = params.categoryIdxs.filter((idx) =>
    categoryOptions.categories.some((category) => category.categoryIdx === idx),
  );

  // 주소의 플랫폼 코드를 idx로 바꾸려면 플랫폼 목록이 있어야 함.
  const search = useCreatorSearch(
    platformOptions.isLoading
      ? null
      : {
          ...detailFilter,
          ...cost,
          keyword: params.keyword,
          platformIdx: platform?.platformIdx,
          categoryIdxs,
          sort: DEFAULT_SORT,
        },
    categoryOptions.allCategoryIdx,
  );
  const isOptionsLoading =
    platformOptions.isLoading || categoryOptions.isLoading;
  const list: CreatorListView = {
    ...search,
    isLoading: search.isLoading || isOptionsLoading,
    isError:
      search.isError || platformOptions.isError || categoryOptions.isError,
    reload: () =>
      Promise.all([
        search.reload(),
        platformOptions.reload(),
        categoryOptions.reload(),
      ]),
  };

  const selection = useRowSelection(
    list.items,
    `${platform?.platformIdx}:${categoryIdxs.join(",")}:${params.keyword}:${JSON.stringify({ ...detailFilter, ...cost })}`,
  );
  const overlays = useCreatorOverlays({
    folderIdx: null,
    onReloadList: () => void list.reload(),
    onDeselect: selection.deselect,
  });
  const { openPropose } = overlays;

  function handleClickRefresh() {
    const hasScreenFilter =
      hasDetailFilter(detailFilter) ||
      Boolean(cost.aiPredictedCost ?? cost.desiredCost);
    if (!params.hasConditions && !hasScreenFilter) {
      void list.reload();
      return;
    }
    params.resetConditions();
    setDetailFilter(EMPTY_DETAIL_FILTER);
    setCost(EMPTY_COST_FILTER);
  }

  function handleApplyDetailFilter(next: DetailFilterValue) {
    setDetailFilter(next);
    setOpenPanel(null);
  }

  function handleApplyBasicFilter(next: BasicFilterValue) {
    params.selectPlatformAndCategories(
      next.platform?.code ?? null,
      next.categoryIdxs,
    );
    setCost(next.cost);
    setOpenPanel(null);
  }

  function handleChangePlatform(next: MatchingPlatform | undefined) {
    params.selectPlatform(next?.code ?? null);
  }

  const isDetailFilterFullScreen = openPanel === "detail" && !isDesktop;
  const isBasicFilterFullScreen = openPanel === "basic" && !isTabletUp;
  const isAssistantFullScreen = openPanel === "assistant" && !isDesktop;
  const isListCovered =
    (overlays.hasPanel && !isDesktop) ||
    isDetailFilterFullScreen ||
    isAssistantFullScreen ||
    isBasicFilterFullScreen;

  const creatorList = (
    <CreatorList
      list={list}
      isDesktop={isDesktop}
      emptyContent={
        <EmptyState
          type="no-search"
          title={t("empty.title")}
          className="flex-1 py-10"
        />
      }
      isProfileCompact
      selectedKeys={selection.selectedKeys}
      onChangeSelected={selection.select}
      onChangeAllSelected={selection.selectAll}
      onClickBookmark={overlays.toggleBookmark}
      onClickPropose={openPropose && ((creator) => openPropose([creator]))}
      onClickItem={overlays.openDetail}
    />
  );

  return (
    <div className="relative h-full desktop:flex desktop:ds-gap-5">
      <title>{t("title")}</title>
      {isDesktop && (
        <div className="flex w-69.5 shrink-0 pt-5">
          <RecommendAssistant
            userName={session.displayName}
            className="flex-1"
          />
        </div>
      )}
      <div
        className="flex h-full min-h-0 min-w-0 flex-1 flex-col ds-gap-5 desktop:pt-5"
        inert={isListCovered}
      >
        <section className="relative flex min-h-0 flex-1 flex-col desktop:gap-3">
          <CreatorToolbar
            isTabletUp={isTabletUp}
            isDesktop={isDesktop}
            keyword={params.keyword}
            onSubmitKeyword={params.submitKeyword}
            onClickRefresh={handleClickRefresh}
            onClickBasicFilter={
              isOptionsLoading ? undefined : () => setOpenPanel("basic")
            }
            onClickDetailFilter={() => setOpenPanel("detail")}
            filterSelects={
              <BasicFilterSelects
                platforms={platforms}
                platformIdx={platform?.platformIdx}
                categories={categoryOptions.categories}
                categoryIdxs={categoryIdxs}
                allCategoryName={categoryOptions.allCategoryName}
                isDisabled={isOptionsLoading}
                onChangePlatform={handleChangePlatform}
                onChangeCategoryIdxs={params.selectCategories}
                cost={cost}
                onChangeCost={setCost}
              />
            }
          />
          {isDesktop ? (
            creatorList
          ) : (
            // 스크롤바가 화면 끝에 오도록 본문 좌우 여백까지 넓힘. 툴바와의 간격은 스크롤해도 남도록 스크롤 영역 밖에 둠.
            <ScrollPanel
              className="-mx-(--ds-p-5) mt-(--ds-gap-3) flex-1"
              contentClassName="flex flex-col px-(--ds-p-5)"
            >
              {creatorList}
            </ScrollPanel>
          )}
          {!isDesktop && (
            <RecommendAssistantButton
              onClick={() => setOpenPanel("assistant")}
            />
          )}
        </section>
        <CreatorSelectionBar
          isTabletUp={isTabletUp}
          selectedCount={selection.selectedItems.length}
          firstActionLabel={term("saveBookmark")}
          onClickFirstAction={() => overlays.openSave(selection.selectedItems)}
          onClickRemove={() => overlays.openRemove(selection.selectedItems)}
          onClickPropose={
            openPropose && (() => openPropose(selection.selectedItems))
          }
        />
      </div>
      {isDetailFilterFullScreen && (
        <CreatorFullScreen>
          <DetailFilterPanel
            value={detailFilter}
            isTabletUp={isTabletUp}
            onApply={handleApplyDetailFilter}
            onClose={() => setOpenPanel(null)}
          />
        </CreatorFullScreen>
      )}
      {isAssistantFullScreen && (
        <RecommendAssistantFullScreen
          userName={session.displayName}
          onClose={() => setOpenPanel(null)}
        />
      )}
      {isBasicFilterFullScreen && (
        <CreatorFullScreen>
          <BasicFilterPanel
            platforms={platforms}
            categories={categoryOptions.categories}
            allCategoryName={categoryOptions.allCategoryName}
            value={{ platform, categoryIdxs, cost }}
            onApply={handleApplyBasicFilter}
            onClose={() => setOpenPanel(null)}
          />
        </CreatorFullScreen>
      )}
      <DetailFilterSheet
        className="w-90.5"
        isOpen={isDesktop && openPanel === "detail"}
        value={detailFilter}
        onApply={handleApplyDetailFilter}
        onClose={() => setOpenPanel(null)}
      />
      <CreatorOverlays
        overlays={overlays}
        isTabletUp={isTabletUp}
        isDesktop={isDesktop}
      />
    </div>
  );
}
