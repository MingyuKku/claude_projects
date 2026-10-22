import { useSearchParams } from "react-router";

import { EmptyState } from "@/shared/components/empty-state";
import { PageNavigator } from "@/shared/components/page-navigator";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";

import { useSubAccounts } from "../api/use-sub-accounts";
import { CreateSubAccountButton } from "./CreateSubAccountButton";
import { SubAccountCardList } from "./SubAccountCardList";
import { SubAccountSearch } from "./SubAccountSearch";
import { SubAccountTable } from "./SubAccountTable";

import type { SubAccountViewModel } from "../model/types";

const KEYWORD_PARAM = "keyword";
const PAGE_PARAM = "page";
const TABLET_QUERY = "(min-width: 768px)";

interface SubAccountListProps {
  /** 권한 부여를 열어 둔 Sub ID. 그 행을 활성(accent) 처리함. */
  activeAccountIdx: number | null;
  onClickCreate: () => void;
  onClickPermission: (account: SubAccountViewModel) => void;
  onClickDelete: (account: SubAccountViewModel) => void;
}

// 검색어·쪽은 URL 쿼리가 소유함(새로고침·뒤로 가기에도 유지). PC·TAB은 표, MO는 카드.
// MO의 화면 하단 고정 생성 버튼은 레이아웃 여백을 알아야 해서 페이지가 그림.
export function SubAccountList({
  activeAccountIdx,
  onClickCreate,
  onClickPermission,
  onClickDelete,
}: SubAccountListProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const { t: tCommon } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isTabletUp = useMediaQuery(TABLET_QUERY);

  const keyword = searchParams.get(KEYWORD_PARAM) ?? "";
  const requestedPage = Number(searchParams.get(PAGE_PARAM)) || 1;
  const { accounts, totalCount, page, totalPages } = useSubAccounts({
    keyword,
    page: requestedPage,
  });

  /** 목록이 바뀌면 열어 둔 권한 부여 섹션은 닫음(스펙 §3). 생성 패널은 그대로 둠. */
  function updateParams(update: (params: URLSearchParams) => void) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      update(params);
      if (params.get("panel") === "permission") {
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

  const isEmpty = totalCount === 0;
  const emptyContent = isEmpty ? (
    <EmptyState
      type={keyword ? "no-search" : "no-list"}
      title={
        keyword
          ? t("list.empty.search.title", { keyword })
          : t("list.empty.none.title")
      }
      description={keyword ? undefined : t("list.empty.none.description")}
      // 시안의 빈 표는 화면 높이를 채움(본문 높이 MO 346·TAB 448·PC 532).
      className="min-h-86.5 tablet:min-h-112 desktop:min-h-133"
    />
  ) : undefined;

  return (
    <div className="flex flex-col gap-4">
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

      {/* 표(또는 카드)와 쪽 이동은 12px 간격으로 한 묶음(시안). */}
      <div className="flex flex-col gap-3">
        {isTabletUp ? (
          <SubAccountTable
            accounts={accounts}
            activeAccountIdx={activeAccountIdx}
            onClickPermission={onClickPermission}
            onClickDelete={onClickDelete}
            emptyContent={emptyContent}
          />
        ) : (
          <>
            {emptyContent ?? (
              <SubAccountCardList
                accounts={accounts}
                activeAccountIdx={activeAccountIdx}
                onClickPermission={onClickPermission}
                onClickDelete={onClickDelete}
              />
            )}
          </>
        )}

        {!isEmpty && (
          <PageNavigator
            page={page}
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
    </div>
  );
}
