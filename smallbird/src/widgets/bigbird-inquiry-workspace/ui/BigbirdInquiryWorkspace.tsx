import { LoaderCircle, Plus } from "lucide-react";
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

// Figma 브랜드명 배지의 최대 폭: 실시간 상담중 카드 104px, 그 외 128px.
const BRAND_BADGE_MAX_WIDTH = {
  consulting: "max-w-26",
  other: "max-w-32",
} as const;

interface BigbirdInquiryWorkspaceProps {
  /** 브랜드명 배지를 채울 캠페인 목록 조회에 쓰는 세션 값. */
  threadUserIdx: number | undefined;
  /** 최신순으로 정렬된 문의 목록. */
  inquiries: BigbirdInquiryViewModel[] | undefined;
  isLoading: boolean;
  isError: boolean;
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
  const isEmptyList = !isLoading && !isError && visible.length === 0;

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
        isEmpty={isLoading || isError || visible.length === 0}
        empty={renderListBody()}
        className={cn(
          "min-h-0 flex-1 rounded-none border-0 tablet:rounded-lg tablet:border desktop:w-94.25 desktop:flex-none",
          isPanelOpen && "hidden desktop:flex",
        )}
      >
        {visible.map((inquiry) => {
          const title = getInquiryTitleKey(inquiry);
          const brandName = campaigns?.find(
            (campaign) => campaign.campaignIdx === inquiry.campaignIdx,
          )?.brandName;
          const isConsulting = inquiry.status === "consulting";
          // 기타 문의는 회색 "기타 문의" 뒤에 최근 메시지를 보여 줌(Figma 3.0.6 카드, REQ-23-0002).
          const preview =
            title.key === "inquiryTitle.other"
              ? getOtherInquiryPreview(inquiry)
              : null;
          return (
            <ChatListItem
              key={inquiry.threadIdx}
              titlePrefix={preview ? t("inquiryTitle.other") : undefined}
              title={
                preview ??
                t(title.key, { name: "name" in title ? title.name : "" })
              }
              badges={[
                {
                  label: t(isConsulting ? "consultingBadge" : inquiry.status),
                  variant: STATUS_BADGE_VARIANT[inquiry.status],
                },
                ...(brandName
                  ? [
                      {
                        label: brandName,
                        variant: "outline" as const,
                        className:
                          BRAND_BADGE_MAX_WIDTH[
                            isConsulting ? "consulting" : "other"
                          ],
                      },
                    ]
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
