import { LoaderCircle, Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import { generatePath, Link, useNavigate, useSearchParams } from "react-router";

import { useInquiryCampaigns } from "@/entities/inquiry";
import { ChatListItem, ChatListPanel } from "@/shared/components/chat-list";
import { EmptyState } from "@/shared/components/empty-state";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import {
  formatListDate,
  getInquiryTitleKey,
  getOtherInquiryPreview,
  getLastActivity,
  STATUS_BADGE_VARIANT,
} from "../lib/format";

import type { BigbirdInquiryViewModel } from "@/entities/inquiry";
import type { ReactNode } from "react";

const STATUS_FILTERS = ["all", "waiting", "consulting", "done"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

/** URL의 `?status=` 값을 목록 필터로 바꿈. 모르는 값은 전체. */
export function toStatusFilter(value: string | null): StatusFilter {
  return STATUS_FILTERS.find((filter) => filter === value) ?? "all";
}

interface BigbirdInquiryWorkspaceProps {
  /** 브랜드명 배지를 채울 캠페인 목록 조회에 쓰는 세션 값. */
  threadUserIdx: number | undefined;
  /** 최신순으로 정렬된 문의 목록. */
  inquiries: BigbirdInquiryViewModel[] | undefined;
  isLoading: boolean;
  isError: boolean;
  /** 서버에 더 불러올 문의가 있는지. 목록 끝에 닿으면 `onLoadMore`로 이어 받음. */
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onClickRefresh: () => void;
  selectedThreadIdx?: number;
  /** TAB·MO에서 목록 대신 오른쪽 패널(대화·새 문의)을 보여 줄지. PC는 항상 둘 다 보임. */
  isPanelOpen: boolean;
  /** 오른쪽 패널. 대화 또는 새 문의 폼. */
  children: ReactNode;
  /** 오른쪽 패널의 접근 가능한 이름(예: 문의 대화, 새 문의). */
  panelLabel: string;
  /** 대화 옆에 열리는 상세 정보. PC·TAB은 대화 옆 277px, MO는 대화 대신 전체 화면. */
  detail?: ReactNode;
}

// Figma 빅버드 문의 PC(5202:101654): 목록(376) + 채팅 패널, 간격 20.
// TAB·MO는 한 번에 한 패널만 보임(목록 ↔ 대화·새 문의).
export function BigbirdInquiryWorkspace({
  threadUserIdx,
  inquiries,
  isLoading,
  isError,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onClickRefresh,
  selectedThreadIdx,
  isPanelOpen,
  children,
  panelLabel,
  detail,
}: BigbirdInquiryWorkspaceProps) {
  const { t } = useTranslation("widgets/bigbird-inquiry-workspace");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  // 목록 필터는 URL에 둠. 대화로 갔다가 뒤로 와도 유지됨.
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = toStatusFilter(searchParams.get("status"));
  // 목록 응답에 브랜드명이 없어(백엔드 확인 중) 캠페인 목록에서 캠페인 번호로 찾음. 못 찾으면 배지를 그리지 않음.
  const { campaigns } = useInquiryCampaigns(threadUserIdx);
  const visible = (inquiries ?? []).filter(
    (inquiry) => statusFilter === "all" || inquiry.status === statusFilter,
  );

  // 목록이 비었으면 PC 오른쪽 패널을 그리지 않습니다(Figma 빈 목록 6790:100192). 특정 문의 URL로 들어온 경우
  // (isPanelOpen)는 "찾을 수 없음" 안내가 필요해 그대로 둡니다.
  const isEmptyList =
    !isLoading && !isError && visible.length === 0 && !hasMore;
  // 다음 쪽 실패는 불러 둔 목록을 가리지 않고 목록 아래에서 다시 시도함. 첫 쪽이 실패했을 때만 오류 화면.
  const isFirstPageError = isError && !inquiries?.length;
  // 탭으로 걸러 비었어도 더 받을 쪽이 있으면 표식을 그려 이어 받음.
  const isListEmpty =
    isLoading || isFirstPageError || (visible.length === 0 && !hasMore);

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
    if (isFirstPageError) {
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
    // 탭으로 걸러 비어도 시안(6782:89921, 탭이 보이는 목록)대로 같은 빈 상태를 보여 줍니다.
    return (
      <EmptyState
        type="no-message"
        title={t("empty.title")}
        description={t("empty.description")}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 gap-5">
      <ChatListPanel
        title={t("listTitle")}
        refreshLabel={t("refresh")}
        onClickRefresh={onClickRefresh}
        action={
          <Button asChild size="sm">
            <Link to={ROUTES.customerCenterBigbirdNew}>
              <Plus />
              {t("newInquiry")}
            </Link>
          </Button>
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
        isEmpty={isListEmpty}
        empty={renderListBody()}
        className={cn(
          "min-h-0 flex-1 rounded-none border-0 tablet:rounded-lg tablet:border desktop:w-94.25 desktop:flex-none",
          isPanelOpen && "hidden desktop:flex",
        )}
      >
        {visible.map((inquiry) => {
          // 목록 응답의 브랜드명·상품명을 먼저 씀(종료 캠페인도 보임). 없으면 캠페인 목록에서 찾음.
          const campaign = campaigns?.find(
            (item) => item.campaignIdx === inquiry.campaignIdx,
          );
          const brandName = inquiry.brandName || campaign?.brandName;
          const title = getInquiryTitleKey(inquiry, campaign?.productName);
          const isOther = title.key === "inquiryTitle.other";
          // Figma 26/10/29 카드(11315:49602·49659): 1행은 상태 배지 + 기타 문의일 때만 "기타문의" 태그,
          // 2행은 캠페인 문의면 회색 브랜드명 + 제목, 기타 문의는 캠페인이 없어 최근 글 메시지 20자만(REQ-23-0002).
          // 최근 메시지는 목록 API에 아직 없어 값이 없으면 그리지 않음(백엔드 요청 중).
          const otherPreview = isOther ? getOtherInquiryPreview(inquiry) : null;
          return (
            <ChatListItem
              key={inquiry.threadIdx}
              titlePrefix={isOther ? undefined : brandName}
              title={
                isOther
                  ? (otherPreview ?? "")
                  : t(title.key, { name: "name" in title ? title.name : "" })
              }
              badges={[
                {
                  label: t(
                    inquiry.status === "consulting"
                      ? "consultingBadge"
                      : inquiry.status,
                  ),
                  variant: STATUS_BADGE_VARIANT[inquiry.status],
                },
                ...(isOther
                  ? [{ label: t("otherTag"), variant: "outline" as const }]
                  : []),
              ]}
              date={formatListDate(getLastActivity(inquiry))}
              isSelected={inquiry.threadIdx === selectedThreadIdx}
              onClickItem={() =>
                void navigate({
                  pathname: generatePath(ROUTES.customerCenterBigbirdThread, {
                    threadIdx: String(inquiry.threadIdx),
                  }),
                  search: searchParams.toString(),
                })
              }
            />
          );
        })}
        {isError && !isFirstPageError && (
          <div className="flex flex-col items-center gap-2 py-4 text-sm text-muted-foreground">
            {t("loadError")}
            <Button variant="outline" size="sm" onClick={onClickRefresh}>
              {tCommon("action.retry")}
            </Button>
          </div>
        )}
        {hasMore && !isError && onLoadMore && (
          <LoadMoreSentinel
            isLoading={isLoadingMore}
            label={tCommon("status.loading")}
            onReach={onLoadMore}
          />
        )}
      </ChatListPanel>

      <div
        className={cn(
          "min-h-0 min-w-0 flex-1 gap-5",
          isPanelOpen ? "flex" : "hidden desktop:flex",
          // 같은 display 계열이라 twMerge가 뒤의 클래스를 남기므로 위 삼항 뒤에 둠
          isEmptyList && !isPanelOpen && "desktop:hidden",
        )}
      >
        <section
          aria-label={panelLabel}
          className={cn(
            "min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-background tablet:rounded-lg tablet:border tablet:border-border",
            // MO는 상세 정보가 열리면 대화 대신 전체 화면으로 보임
            detail ? "hidden tablet:flex" : "flex",
          )}
        >
          {children}
        </section>
        {detail && (
          <section
            aria-label={t("detail")}
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background tablet:w-69.25 tablet:flex-none tablet:rounded-lg tablet:border tablet:border-border"
          >
            {detail}
          </section>
        )}
      </div>
    </div>
  );
}

/** 목록 맨 아래에 두는 표식. 화면에 들어오면 다음 문의를 이어 받음(무한 스크롤). */
function LoadMoreSentinel({
  isLoading,
  label,
  onReach,
}: {
  isLoading: boolean;
  label: string;
  onReach: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // 받는 중에는 관찰을 멈추고, 끝나면 다시 걸어 표식이 아직 보이면 바로 다음 쪽을 받음.
  useEffect(() => {
    const element = ref.current;
    if (!element || isLoading || typeof IntersectionObserver === "undefined")
      return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) onReach();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [isLoading, onReach]);

  return (
    <div ref={ref} className="flex h-12 items-center justify-center">
      {isLoading && (
        <LoaderCircle
          role="status"
          aria-label={label}
          className="size-5 animate-spin text-muted-foreground"
        />
      )}
    </div>
  );
}
