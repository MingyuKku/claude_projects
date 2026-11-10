import { LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { generatePath, useNavigate, useSearchParams } from "react-router";

import { useInquiryCampaigns } from "@/entities/inquiry";
import { ChatListItem, ChatListPanel } from "@/shared/components/chat-list";
import { EmptyState } from "@/shared/components/empty-state";
import { SearchInput } from "@/shared/components/search-input";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import {
  STATUS_FILTERS,
  toBuyerInquiryFilters,
  toBuyerStatusFilter,
  toSourceParam,
} from "../lib/filters";
import {
  formatListDate,
  getBuyerCardText,
  STATUS_BADGE_VARIANT,
} from "../lib/format";
import { INQUIRY_MENU } from "../model/menu";
import { OPENED_BY_USER_STATE } from "../model/realtime-inquiry-idx";
import { BuyerFilterChips } from "./BuyerFilterChips";
import { BuyerInquiryFilterDialog } from "./BuyerInquiryFilterDialog";

import type { InquiryMenu } from "../model/menu";
import type {
  BuyerInquiryFilters,
  BuyerInquiryViewModel,
} from "@/entities/inquiry";
import type { FormEvent, ReactNode } from "react";

interface BuyerInquiryWorkspaceProps {
  menu: InquiryMenu;
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
  menu,
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
  const filters = toBuyerInquiryFilters(searchParams, menu);
  const sentinelRef = useRef<HTMLLIElement>(null);
  const { campaigns } = useInquiryCampaigns(threadUserIdx);

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

  function toCardTitle(inquiry: BuyerInquiryViewModel) {
    const text = getBuyerCardText(inquiry, campaigns);
    return text.kind === "campaign"
      ? {
          titlePrefix: text.brandName ?? undefined,
          title: t("card.campaignInquiry", {
            label: [text.campaignName, text.influencerNickname]
              .filter(Boolean)
              .join(" "),
          }),
        }
      : { title: text.text };
  }

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

  function handleRemoveSource() {
    setSearchParams((params) => {
      params.delete("source");
      return params;
    });
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
      const source = toSourceParam(value.sourceType);
      if (source) params.set("source", source);
      else params.delete("source");
      if (value.campaignIdx === undefined) params.delete("campaignIdx");
      else params.set("campaignIdx", String(value.campaignIdx));
      if (value.influencerThreadUserIdx === undefined)
        params.delete("influencerThreadUserIdx");
      else
        params.set(
          "influencerThreadUserIdx",
          String(value.influencerThreadUserIdx),
        );
      if (value.startDate && value.endDate) {
        params.set("startDate", value.startDate);
        params.set("endDate", value.endDate);
      } else {
        params.delete("startDate");
        params.delete("endDate");
      }
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
              menu={menu}
              value={filters}
              threadUserIdx={threadUserIdx}
              onApply={handleApplyFilters}
            />
          </>
        }
        filters={
          filters.sourceType === "ALL" &&
          filters.campaignIdx === undefined ? undefined : (
            <BuyerFilterChips
              filters={filters}
              threadUserIdx={threadUserIdx}
              onRemoveSource={handleRemoveSource}
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
          "min-h-0 flex-1 rounded-none border-0 tablet:rounded-lg tablet:border desktop:w-94.25 desktop:flex-none",
          isPanelOpen && "hidden desktop:flex",
        )}
      >
        {inquiries?.map((inquiry) => (
          <ChatListItem
            key={inquiry.key}
            // 상태 배지는 항상 붙임(Figma 26/10/29 11315:50439, 사용자 결정 2026-10-30).
            badges={[
              {
                label: t(`status.${inquiry.status}`),
                variant: STATUS_BADGE_VARIANT[inquiry.status],
              },
              { label: t(`source.${inquiry.source}`), variant: "outline" },
            ]}
            // 메시지가 없는 스레드는 작성 시각이 없어 날짜를 비움.
            date={
              inquiry.lastActivityAt
                ? formatListDate(inquiry.lastActivityAt)
                : ""
            }
            // 첫 줄 브랜드명 + "캠페인명 문의", 둘째 줄 "@작성자"(Figma 26/10/29 11315:50439, 사용자 결정 2026-10-30).
            {...toCardTitle(inquiry)}
            caption={`@${inquiry.writerName ?? t("unknownWriter")}`}
            hasAlert={inquiry.hasUnread}
            alertLabel={t("card.unread")}
            highlight={filters.keyword}
            isSelected={inquiry.key === selectedKey}
            onClickItem={() =>
              void navigate(
                {
                  pathname: generatePath(INQUIRY_MENU[menu].threadRoute, {
                    inquiryKey: inquiry.key,
                  }),
                  search: searchParams.toString(),
                },
                { state: OPENED_BY_USER_STATE },
              )
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
          // 테두리는 안쪽 패널(대화·상세, 빈 화면)이 각자 그립니다. Figma는 둘을 떨어진 박스로 그립니다.
          "min-h-0 min-w-0 flex-1 flex-col bg-background",
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
