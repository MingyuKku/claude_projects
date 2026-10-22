import { LoaderCircle, Plus } from "lucide-react";
import { generatePath, Link, useNavigate, useSearchParams } from "react-router";

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
}

// Figma 빅버드 문의 PC(5202:101654): 목록(376) + 채팅 패널, 간격 20.
// TAB·MO는 한 번에 한 패널만 보임(목록 ↔ 대화·새 문의).
export function BigbirdInquiryWorkspace({
  inquiries,
  isLoading,
  isError,
  onClickRefresh,
  selectedThreadIdx,
  isPanelOpen,
  children,
  panelLabel,
}: BigbirdInquiryWorkspaceProps) {
  const { t } = useTranslation("widgets/bigbird-inquiry-workspace");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  // 목록 필터는 URL에 둠. 대화로 갔다가 뒤로 와도 유지됨.
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = toStatusFilter(searchParams.get("status"));
  const visible = (inquiries ?? []).filter(
    (inquiry) => statusFilter === "all" || inquiry.status === statusFilter,
  );

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
    if (inquiries?.length) {
      return <EmptyState type="no-list" title={t("filterEmpty")} />;
    }
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
          "min-h-0 flex-1 rounded-none border-0 tablet:rounded-lg tablet:border desktop:w-94 desktop:flex-none",
          isPanelOpen && "hidden desktop:flex",
        )}
      >
        {visible.map((inquiry) => {
          const title = getInquiryTitleKey(inquiry);
          return (
            <ChatListItem
              key={inquiry.threadIdx}
              title={t(title.key, { name: "name" in title ? title.name : "" })}
              badges={[
                {
                  label: t(inquiry.status),
                  variant: STATUS_BADGE_VARIANT[inquiry.status],
                },
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

      <section
        aria-label={panelLabel}
        className={cn(
          "min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-background tablet:rounded-lg tablet:border tablet:border-border",
          isPanelOpen ? "flex" : "hidden desktop:flex",
        )}
      >
        {children}
      </section>
    </div>
  );
}
