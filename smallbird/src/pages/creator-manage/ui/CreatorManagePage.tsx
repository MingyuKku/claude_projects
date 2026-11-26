import { useState } from "react";
import { useOutletContext } from "react-router";

import {
  CreatorFullScreen,
  CreatorSelectionBar,
  isSameTargets,
  useBookmarkFolders,
  useBookmarkList,
  useMatchingCategories,
  useMatchingPlatforms,
  useRowSelection,
  useCreatorTerms,
} from "@/entities/creator";
import {
  BasicFilterPanel,
  DetailFilterPanel,
  DetailFilterSheet,
  EMPTY_COST_FILTER,
  EMPTY_DETAIL_FILTER,
  hasDetailFilter,
  sortPlatformsByMenu,
} from "@/features/filter-creators";
import {
  ManageFoldersPanel,
  ManageFoldersSheet,
} from "@/features/manage-folders";
import { MoveBookmarkPanel, MoveBookmarkSheet } from "@/features/move-bookmark";
import {
  RecommendAssistantButton,
  RecommendAssistantFullScreen,
} from "@/features/recommend-creators";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";
import { CreatorOverlays, useCreatorOverlays } from "@/widgets/creator-detail";

import { useManageParams } from "../model/use-manage-params";
import { FolderCarousel } from "./FolderCarousel";
import { ManageList } from "./ManageList";
import { ManageToolbar } from "./ManageToolbar";

import type {
  CreatorListView,
  CreatorViewModel,
  MatchingPlatform,
} from "@/entities/creator";
import type { SessionViewModel } from "@/entities/session";
import type {
  BasicFilterValue,
  DetailFilterValue,
} from "@/features/filter-creators";

type OpenPanel = "basic" | "detail" | "folders" | "assistant";

// 폴더·검색어·플랫폼·카테고리는 주소 쿼리가 소유함.
// 상세의 다른 플랫폼은 저장 안 됐을 수 있어 저장 창도 둠.
export function CreatorManagePage() {
  const { t } = useTranslation("pages/creator-manage");
  const { term } = useCreatorTerms();
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const session = useOutletContext<SessionViewModel>();
  const params = useManageParams();
  const folders = useBookmarkFolders();
  const [detailFilter, setDetailFilter] = useState(EMPTY_DETAIL_FILTER);
  const [cost, setCost] = useState(EMPTY_COST_FILTER);
  const platformOptions = useMatchingPlatforms();
  const categoryOptions = useMatchingCategories();
  const { categories, allCategoryName } = categoryOptions;
  const [openPanel, setOpenPanel] = useState<OpenPanel | null>(null);
  const [moveTargets, setMoveTargets] = useState<CreatorViewModel[] | null>(
    null,
  );
  // 지워진 폴더 주소로 들어오면 `전체`로 봄.
  const isUnknownFolder =
    params.folderIdx !== null &&
    folders.folders.length > 0 &&
    !folders.folders.some((folder) => folder.folderIdx === params.folderIdx);
  const folderIdx = isUnknownFolder ? null : params.folderIdx;

  const platforms = sortPlatformsByMenu(platformOptions.platforms);
  // 주소에 없거나 모르는 값이면 전체 플랫폼.
  const platform = platforms.find((item) => item.code === params.platformCode);

  const categoryIdxs = params.categoryIdxs.filter((idx) =>
    categories.some((category) => category.categoryIdx === idx),
  );

  // 주소의 플랫폼 코드를 idx로 바꾸려면 플랫폼 목록이 있어야 함.
  const isOptionsPending =
    (params.platformCode !== null && platformOptions.isLoading) ||
    (params.categoryIdxs.length > 0 && categoryOptions.isLoading);
  // 선택지를 못 읽으면 주소의 조건을 걸 수 없어 목록도 실패로 보임.
  const isOptionsFailed =
    (params.platformCode !== null && platformOptions.isError) ||
    (params.categoryIdxs.length > 0 && categoryOptions.isError);
  const bookmarks = useBookmarkList(
    isOptionsPending || isOptionsFailed
      ? null
      : {
          ...detailFilter,
          ...cost,
          folderIdx,
          categoryIdxs,
          keyword: params.keyword,
          platformIdx: platform?.platformIdx,
        },
  );
  const list: CreatorListView & { totalCount: number | undefined } = {
    ...bookmarks,
    isLoading: bookmarks.isLoading || isOptionsPending,
    isError: bookmarks.isError || isOptionsFailed,
    reload: () =>
      Promise.all([
        bookmarks.reload(),
        platformOptions.reload(),
        categoryOptions.reload(),
      ]),
  };
  const selection = useRowSelection(
    list.items,
    `${folderIdx ?? "all"}:${params.keyword}:${platform?.platformIdx}:${categoryIdxs.join(",")}:${JSON.stringify({ ...detailFilter, ...cost })}`,
  );
  const overlays = useCreatorOverlays({
    folderIdx,
    onReloadList: () => void list.reload(),
    onDeselect: selection.deselect,
  });
  const { openPropose } = overlays;

  const hasFilter =
    Boolean(platform) ||
    categoryIdxs.length > 0 ||
    Boolean(cost.aiPredictedCost ?? cost.desiredCost) ||
    hasDetailFilter(detailFilter);

  function handleClickRefresh() {
    if (!params.keyword && !hasFilter) {
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

  function handleChangePlatform(next: MatchingPlatform | undefined) {
    params.selectPlatform(next?.code ?? null);
  }

  function handleApplyBasicFilter(next: BasicFilterValue) {
    params.selectPlatformAndCategories(
      next.platform?.code ?? null,
      next.categoryIdxs,
    );
    setCost(next.cost);
    setOpenPanel(null);
  }

  function handleFoldersSaved() {
    setOpenPanel((current) => (current === "folders" ? null : current));
    void list.reload();
  }

  function handleMoved() {
    selection.deselect((moveTargets ?? []).map((item) => item.key));
    setMoveTargets((current) =>
      isSameTargets(current, moveTargets) ? null : current,
    );
    void list.reload();
  }

  function closePanel() {
    setOpenPanel(null);
  }

  // TAB·MO에서 목록을 덮는 창(상세·저장·제안은 CreatorOverlays가 그림).
  function renderFullScreen() {
    if (isDesktop) return null;
    if (moveTargets) {
      return (
        <MoveBookmarkPanel
          targets={moveTargets}
          onClose={() => setMoveTargets(null)}
          onMoved={handleMoved}
        />
      );
    }
    if (openPanel === "folders") {
      return (
        <ManageFoldersPanel
          onClose={closePanel}
          onSaved={handleFoldersSaved}
          onSaveFailed={() => void list.reload()}
        />
      );
    }
    if (openPanel === "detail") {
      return (
        <DetailFilterPanel
          value={detailFilter}
          isTabletUp={isTabletUp}
          onApply={handleApplyDetailFilter}
          onClose={closePanel}
        />
      );
    }
    if (openPanel === "basic" && !isTabletUp) {
      return (
        <BasicFilterPanel
          platforms={platforms}
          categories={categories}
          allCategoryName={allCategoryName}
          value={{ platform, categoryIdxs, cost }}
          onApply={handleApplyBasicFilter}
          onClose={closePanel}
        />
      );
    }
    return null;
  }

  const fullScreen = renderFullScreen();
  const isAssistantOpen = openPanel === "assistant" && !isDesktop;
  const isListCovered =
    fullScreen !== null || isAssistantOpen || (overlays.hasPanel && !isDesktop);

  const content = (
    <>
      <FolderCarousel
        folders={folders.folders}
        isLoading={folders.isLoading}
        isError={folders.isError}
        onClickRetry={() => void folders.reload()}
        selectedFolderIdx={folderIdx}
        totalCount={list.totalCount}
        onSelectFolder={params.selectFolder}
        onClickSettings={() => setOpenPanel("folders")}
      />
      <section className="flex shrink-0 flex-col desktop:min-h-0 desktop:flex-1 desktop:shrink desktop:gap-3">
        {/* TAB·MO는 폴더 카드가 지나가면 툴바가 위에 붙고, 카드와의 간격도 툴바와 함께 붙어 있음. */}
        <div className="sticky top-0 z-10 bg-background pb-(--ds-gap-3) desktop:static desktop:pb-0">
          <ManageToolbar
            isTabletUp={isTabletUp}
            isDesktop={isDesktop}
            keyword={params.keyword}
            platforms={platforms}
            platformIdx={platform?.platformIdx}
            categories={categories}
            categoryIdxs={categoryIdxs}
            allCategoryName={allCategoryName}
            cost={cost}
            isOptionsLoading={
              platformOptions.isLoading || categoryOptions.isLoading
            }
            onChangePlatform={handleChangePlatform}
            onChangeCategoryIdxs={params.selectCategories}
            onChangeCost={setCost}
            onSubmitKeyword={params.submitKeyword}
            onClickRefresh={handleClickRefresh}
            onClickBasicFilter={() => setOpenPanel("basic")}
            onClickDetailFilter={() => setOpenPanel("detail")}
          />
        </div>
        <ManageList
          list={list}
          isTabletUp={isTabletUp}
          isDesktop={isDesktop}
          keyword={params.keyword}
          folderIdx={folderIdx}
          hasFilter={hasFilter}
          selectedKeys={selection.selectedKeys}
          onChangeSelected={selection.select}
          onChangeAllSelected={selection.selectAll}
          onClickBookmark={(creator) => overlays.openRemove([creator])}
          onClickPropose={openPropose && ((creator) => openPropose([creator]))}
          onClickItem={overlays.openDetail}
        />
      </section>
    </>
  );

  return (
    <div className="relative h-full">
      <title>{t("title")}</title>
      <div
        className="flex h-full min-h-0 flex-col ds-gap-5"
        inert={isListCovered}
      >
        <div className="relative flex min-h-0 flex-1 flex-col">
          {isDesktop ? (
            <div className="flex min-h-0 flex-1 flex-col gap-6">{content}</div>
          ) : (
            // 스크롤바가 화면 끝에 오도록 본문 좌우 여백까지 넓힘.
            <ScrollPanel
              className="-mx-(--ds-p-5) flex-1"
              contentClassName="flex flex-col gap-3 px-(--ds-p-5) tablet:gap-5"
            >
              {content}
            </ScrollPanel>
          )}
          {!isDesktop && (
            <RecommendAssistantButton
              onClick={() => setOpenPanel("assistant")}
            />
          )}
        </div>
        <CreatorSelectionBar
          isTabletUp={isTabletUp}
          selectedCount={selection.selectedItems.length}
          firstActionLabel={term("moveGroup")}
          onClickFirstAction={() => setMoveTargets(selection.selectedItems)}
          onClickRemove={() => overlays.openRemove(selection.selectedItems)}
          onClickPropose={
            openPropose && (() => openPropose(selection.selectedItems))
          }
        />
      </div>
      {isAssistantOpen && (
        <RecommendAssistantFullScreen
          userName={session.displayName}
          onClose={closePanel}
        />
      )}
      {fullScreen && <CreatorFullScreen>{fullScreen}</CreatorFullScreen>}
      <MoveBookmarkSheet
        targets={isDesktop ? moveTargets : null}
        onClose={() => setMoveTargets(null)}
        onMoved={handleMoved}
      />
      <ManageFoldersSheet
        isOpen={isDesktop && openPanel === "folders"}
        onClose={closePanel}
        onSaved={handleFoldersSaved}
        onSaveFailed={() => void list.reload()}
      />
      <DetailFilterSheet
        className="w-104.5"
        isOpen={isDesktop && openPanel === "detail"}
        value={detailFilter}
        onApply={handleApplyDetailFilter}
        onClose={closePanel}
      />
      <CreatorOverlays
        overlays={overlays}
        isTabletUp={isTabletUp}
        isDesktop={isDesktop}
      />
    </div>
  );
}
