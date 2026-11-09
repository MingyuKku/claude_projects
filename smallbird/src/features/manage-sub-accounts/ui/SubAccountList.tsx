import { useEffect } from "react";
import { useSearchParams } from "react-router";

import { EmptyState } from "@/shared/components/empty-state";
import {
  EmptyTableFrame,
  emptyHeightVariants,
} from "@/shared/components/list-filter";
import { PageNavigator } from "@/shared/components/page-navigator";
import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { useSubAccounts } from "../api/use-sub-accounts";
import { useListParams } from "../lib/use-list-params";
import {
  EMPTY_LIST_MAX_HEIGHT_CLASS,
  KEYWORD_PARAM,
  PAGE_PARAM,
} from "../model/constants";
import { CreateSubAccountButton } from "./CreateSubAccountButton";
import { SubAccountCardList } from "./SubAccountCardList";
import { SubAccountListSkeleton } from "./SubAccountListSkeleton";
import { SubAccountSearch } from "./SubAccountSearch";
import { SubAccountTable } from "./SubAccountTable";

import type { SubAccountViewModel } from "../model/types";

// 표는 PC(1440~)만 쓰고 TAB·MO는 카드(2026-10-27 시안).

interface SubAccountListProps {
  /** 권한 부여·수정을 열어 둔 Sub ID. 그 행을 활성(accent) 처리함. */
  activeAccountIdx: number | null;
  onClickCreate: () => void;
  onClickPermission: (account: SubAccountViewModel) => void;
  onClickEdit: (account: SubAccountViewModel) => void;
  onClickDelete: (account: SubAccountViewModel) => void;
}

// 검색어·쪽은 URL 쿼리가 소유함(새로고침·뒤로 가기에도 유지). 검색·쪽 나눔은 서버가 함. PC는 표, TAB·MO는 카드.
// MO의 화면 하단 고정 생성 버튼은 레이아웃 여백을 알아야 해서 페이지가 그림.
export function SubAccountList({
  activeAccountIdx,
  onClickCreate,
  onClickPermission,
  onClickEdit,
  onClickDelete,
}: SubAccountListProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const { t: tCommon } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);

  const { keyword, page: requestedPage } = useListParams();
  const { list, isLoading, isError, mutate } = useSubAccounts({
    keyword,
    page: requestedPage,
  });
  const totalPages = list?.totalPages ?? 0;
  // 마지막 쪽의 마지막 항목을 지웠거나 주소를 직접 고쳐 범위를 벗어난 쪽은 마지막 쪽으로 당김.
  const isPageOutOfRange =
    list !== undefined && totalPages > 0 && requestedPage > totalPages;

  useEffect(() => {
    if (!isPageOutOfRange) return;
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set(PAGE_PARAM, String(totalPages));
        return params;
      },
      { replace: true },
    );
  }, [isPageOutOfRange, totalPages, setSearchParams]);

  /** 목록이 바뀌면 열어 둔 권한 부여·수정 패널은 닫음(스펙 §3). 생성 패널은 그대로 둠. */
  function updateParams(update: (params: URLSearchParams) => void) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      update(params);
      if (["permission", "edit"].includes(params.get("panel") ?? "")) {
        params.delete("panel");
        params.delete("subId");
      }
      return params;
    });
  }

  function handleSubmitKeyword(next: string) {
    updateParams((params) => {
      if (next) params.set(KEYWORD_PARAM, next);
      else params.delete(KEYWORD_PARAM);
      params.delete(PAGE_PARAM);
    });
  }

  function buildPageHref(target: number) {
    const params = new URLSearchParams(searchParams);
    params.set(PAGE_PARAM, String(target));
    return `?${params.toString()}`;
  }

  const accounts = list?.accounts ?? [];
  const isEmpty = list?.totalCount === 0;
  const emptyContent = isEmpty ? (
    <EmptyState
      type={keyword ? "no-search" : "no-list"}
      title={
        keyword
          ? t("list.empty.search.title", { keyword })
          : t("list.empty.none.title")
      }
      description={keyword ? undefined : t("list.empty.none.description")}
      className={emptyHeightVariants()}
    />
  ) : undefined;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <SubAccountSearch
          // 적용된 검색어가 바뀌면(뒤로 가기 등) 입력칸도 맞춤.
          key={keyword}
          keyword={keyword}
          onSubmitKeyword={handleSubmitKeyword}
          className="min-w-0 flex-1 tablet:w-71.75 tablet:flex-none"
        />
        <CreateSubAccountButton
          className="hidden tablet:inline-flex"
          onClick={onClickCreate}
        />
      </div>

      {/* 표(또는 카드)와 쪽 이동은 12px 간격으로 한 묶음(시안). 빈 상태가 남은 높이를 채우되 시안 높이까지만 늘어남. */}
      {isLoading ? (
        <SubAccountListSkeleton isTable={isDesktop} />
      ) : isError || !list ? (
        <EmptyState
          type="alarm"
          title={tCommon("error.unexpected")}
          className="py-20"
          action={
            <Button variant="outline" onClick={() => void mutate()}>
              {tCommon("action.retry")}
            </Button>
          }
        />
      ) : (
        <div
          className={cn(
            "flex flex-1 flex-col gap-3",
            isEmpty && EMPTY_LIST_MAX_HEIGHT_CLASS,
          )}
        >
          {isDesktop ? (
            <SubAccountTable
              accounts={accounts}
              activeAccountIdx={activeAccountIdx}
              onClickPermission={onClickPermission}
              onClickEdit={onClickEdit}
              onClickDelete={onClickDelete}
              emptyContent={emptyContent}
            />
          ) : (
            <>
              {emptyContent ? (
                // TAB 시안만 빈 상태를 테두리 박스에 담고 MO는 테두리가 없음.
                isTabletUp ? (
                  <EmptyTableFrame>{emptyContent}</EmptyTableFrame>
                ) : (
                  emptyContent
                )
              ) : (
                <SubAccountCardList
                  accounts={accounts}
                  activeAccountIdx={activeAccountIdx}
                  onClickPermission={onClickPermission}
                  onClickEdit={onClickEdit}
                  onClickDelete={onClickDelete}
                />
              )}
            </>
          )}

          {!isEmpty && (
            <PageNavigator
              page={list.page}
              totalPages={totalPages}
              buildHref={buildPageHref}
              onChangePage={(target) =>
                updateParams((params) => params.set(PAGE_PARAM, String(target)))
              }
              labels={{
                navigation: tCommon("pagination.navigation"),
                previous: tCommon("pagination.previous"),
                next: tCommon("pagination.next"),
                page: (target) => tCommon("pagination.page", { page: target }),
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
