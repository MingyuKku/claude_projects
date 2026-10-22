import { LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { generatePath, useNavigate, useSearchParams } from "react-router";

import { ChatListItem, ChatListPanel } from "@/shared/components/chat-list";
import { EmptyState } from "@/shared/components/empty-state";
import { SearchInput } from "@/shared/components/search-input";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { formatListDate, STATUS_BADGE_VARIANT } from "../lib/format";
import { BuyerFilterChips } from "./BuyerFilterChips";
import { BuyerInquiryFilterDialog } from "./BuyerInquiryFilterDialog";

import type {
  BuyerInquiryStatusFilter,
  BuyerInquiryFilters,
  BuyerInquiryViewModel,
} from "@/entities/inquiry";
import type { FormEvent, ReactNode } from "react";

const STATUS_FILTERS = ["all", "waiting", "done"] as const;

function toPositiveNumber(value: string | null) {
  const number = Number(value);
  return value !== null && Number.isSafeInteger(number) && number > 0
    ? number
    : undefined;
}

export function toBuyerInquiryFilters(
  params: URLSearchParams,
): BuyerInquiryFilters {
  const source = params.get("source");
  const campaignIdx = toPositiveNumber(params.get("campaignIdx"));
  return {
    sourceType:
      source === "purchaser"
        ? "PURCHASER_QUESTION"
        : source === "qna"
          ? "PRODUCT_QNA"
          : "ALL",
    campaignIdx,
    influencerThreadUserIdx:
      campaignIdx === undefined
        ? undefined
        : toPositiveNumber(params.get("influencerThreadUserIdx")),
    keyword: params.get("q")?.trim() || undefined,
  };
}

/** URL의 `?status=` 값을 목록 필터로 바꿈. 모르는 값(재문의 포함)은 전체. */
export function toBuyerStatusFilter(
  value: string | null,
): BuyerInquiryStatusFilter {
  return STATUS_FILTERS.find((filter) => filter === value) ?? "all";
}

interface BuyerInquiryWorkspaceProps {
  /** 서버가 준 순서(최신순) 그대로의 문의 목록. */
  inquiries: BuyerInquiryViewModel[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onClickRefresh: () => void;
  onLoadMore: () => void;
  selectedKey?: string;
  /** TAB·MO에서 목록 대신 오른쪽 패널(대화)을 보여 줄지. PC는 항상 둘 다 보임. */
  isPanelOpen: boolean;
  /** 오른쪽 패널(대화·상세 정보). */
  children: ReactNode;
  panelLabel: string;
  threadUserIdx?: number;
}

// Figma 구매자 문의 PC(5202:105720): 목록 + 채팅 + 상세 정보, 간격 20.
// TAB·MO는 한 번에 한 화면만 보임(목록 ↔ 채팅).
export function BuyerInquiryWorkspace({
  inquiries,
  isLoading,
  isError,
  isLoadingMore,
  hasMore,
  onClickRefresh,
  onLoadMore,
  selectedKey,
  isPanelOpen,
  children,
  panelLabel,
  threadUserIdx,
}: BuyerInquiryWorkspaceProps) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  // 목록 필터는 URL에 둠. 대화로 갔다가 뒤로 와도 유지됨.
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = toBuyerStatusFilter(searchParams.get("status"));
  const filters = toBuyerInquiryFilters(searchParams);
  const sentinelRef = useRef<HTMLLIElement>(null);

  // 목록 끝이 보이면 다음 쪽을 받음. 받는 중에는 다시 부르지 않음.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoadingMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore, inquiries?.length]);

  function handleChangeStatus(value: string) {
    setSearchParams(
      (params) => {
        if (value === "all") params.delete("status");
        else params.set("status", value);
        return params;
      },
      { replace: true },
    );
  }

  // 검색은 Enter로 적용함(입력할 때마다 요청하지 않음). 비우고 Enter를 누르면 검색을 풂.
  function handleSubmitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const keyword = String(
      new FormData(event.currentTarget).get("q") ?? "",
    ).trim();
    setSearchParams(
      (params) => {
        if (keyword) params.set("q", keyword);
        else params.delete("q");
        return params;
      },
      { replace: true },
    );
  }

  function handleRemoveCampaign() {
    setSearchParams((params) => {
      params.delete("campaignIdx");
      params.delete("influencerThreadUserIdx");
      return params;
    });
  }

  function handleRemoveInfluencer() {
    setSearchParams((params) => {
      params.delete("influencerThreadUserIdx");
      return params;
    });
  }

  function handleApplyFilters(value: BuyerInquiryFilters) {
    setSearchParams((params) => {
      if (value.sourceType === "ALL") params.delete("source");
      else
        params.set(
          "source",
          value.sourceType === "PURCHASER_QUESTION" ? "purchaser" : "qna",
        );
      if (value.campaignIdx === undefined) params.delete("campaignIdx");
      else params.set("campaignIdx", String(value.campaignIdx));
      if (value.influencerThreadUserIdx === undefined)
        params.delete("influencerThreadUserIdx");
      else
        params.set(
          "influencerThreadUserIdx",
          String(value.influencerThreadUserIdx),
        );
      return params;
    });
  }

  function renderListBody() {
    if (isLoading) {
      return (
        <LoaderCircle
          role="status"
          aria-label={tCommon("status.loading")}
          className="size-6 animate-spin text-muted-foreground"
        />
      );
    }
    if (isError) {
      return (
        <EmptyState
          type="no-list"
          title={t("loadError")}
          action={
            <Button variant="outline" size="sm" onClick={onClickRefresh}>
              {tCommon("action.retry")}
            </Button>
          }
        />
      );
    }
    if (filters.keyword) {
      return (
        <EmptyState
          type="no-search"
          title={t("searchEmpty", { keyword: filters.keyword })}
        />
      );
    }
    return <EmptyState type="no-message" title={t("empty")} />;
  }

  const hasItems = Boolean(inquiries?.length);
  const isEmptyList = !isLoading && !isError && !hasItems;

  return (
    <div className="flex h-full min-h-0 min-w-0 gap-5">
      <ChatListPanel
        title={t("listTitle")}
        refreshLabel={t("refresh")}
        onClickRefresh={onClickRefresh}
        search={
          <>
            <form
              role="search"
              key={filters.keyword ?? ""}
              onSubmit={handleSubmitSearch}
              className="flex min-w-0 flex-1"
            >
              <SearchInput
                variant="filled"
                name="q"
                defaultValue={filters.keyword ?? ""}
                aria-label={t("searchPlaceholder")}
                placeholder={t("searchPlaceholder")}
                className="min-w-0 flex-1"
              />
            </form>
            <BuyerInquiryFilterDialog
              value={filters}
              threadUserIdx={threadUserIdx}
              onApply={handleApplyFilters}
            />
          </>
        }
        filters={
          filters.campaignIdx === undefined ? undefined : (
            <BuyerFilterChips
              filters={filters}
              threadUserIdx={threadUserIdx}
              onRemoveCampaign={handleRemoveCampaign}
              onRemoveInfluencer={handleRemoveInfluencer}
            />
          )
        }
        tabs={
          <Tabs value={statusFilter} onValueChange={handleChangeStatus}>
            <TabsList className="w-full">
              {STATUS_FILTERS.map((filter) => (
                <TabsTrigger key={filter} value={filter}>
                  {t(filter)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
        isEmpty={isLoading || isError || !hasItems}
        empty={renderListBody()}
        className={cn(
          "min-h-0 flex-1 rounded-none border-0 tablet:rounded-lg tablet:border desktop:w-94 desktop:flex-none",
          isPanelOpen && "hidden desktop:flex",
        )}
      >
        {inquiries?.map((inquiry) => (
          <ChatListItem
            key={inquiry.key}
            // 상태 배지는 답변 대기일 때만 붙임(Figma MO 6791:63495, 사용자 결정 2026-10-20).
            badges={[
              ...(inquiry.status === "waiting"
                ? [
                    {
                      label: t(`status.${inquiry.status}`),
                      variant: STATUS_BADGE_VARIANT[inquiry.status],
                    },
                  ]
                : []),
              { label: t(`source.${inquiry.source}`), variant: "gray" },
            ]}
            // 메시지가 없는 스레드는 작성 시각이 없어 날짜를 비움.
            date={
              inquiry.lastActivityAt
                ? formatListDate(inquiry.lastActivityAt)
                : ""
            }
            user={{ name: inquiry.writerName ?? t("unknownWriter") }}
            preview={inquiry.preview}
            highlight={filters.keyword}
            isSelected={inquiry.key === selectedKey}
            onClickItem={() =>
              void navigate({
                pathname: generatePath(ROUTES.customerCenterBuyerThread, {
                  inquiryKey: inquiry.key,
                }),
                search: searchParams.toString(),
              })
            }
          />
        ))}
        {hasMore && <li ref={sentinelRef} aria-hidden className="h-px" />}
        {isLoadingMore && (
          <li className="flex justify-center py-4">
            <LoaderCircle
              role="status"
              aria-label={tCommon("status.loading")}
              className="size-5 animate-spin text-muted-foreground"
            />
          </li>
        )}
      </ChatListPanel>

      <section
        aria-label={panelLabel}
        className={cn(
          "min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-background tablet:rounded-lg tablet:border tablet:border-border",
          isPanelOpen ? "flex" : "hidden desktop:flex",
          // 목록이 비었으면 오른쪽 패널을 그리지 않음(Figma 구매자 문의 Empty 6790:100517).
          isEmptyList && "desktop:hidden",
        )}
      >
        {children}
      </section>
    </div>
  );
}
