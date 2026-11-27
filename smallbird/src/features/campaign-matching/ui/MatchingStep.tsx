import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  PROPOSAL_STATUSES,
  useCampaignProposals,
} from "@/entities/campaign-progress";
import { CreatorSheet } from "@/entities/creator";
import { CountCard } from "@/shared/components/cards";
import { Inform } from "@/shared/components/inform";
import {
  FilterToolbar,
  ListEmptyState,
  ListPagination,
  resolveEmptyKind,
} from "@/shared/components/list-filter";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import {
  SkeletonGroup,
  TableSkeleton,
} from "@/shared/components/skeleton-presets";
import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { getNextExpiryDelay } from "../lib/remaining-time";
import { useMatchingParams } from "../lib/use-matching-params";
import { useProposalSelection } from "../lib/use-proposal-selection";
import { PAGE_SIZE_OPTIONS, SEARCH_MAX_LENGTH } from "../model/constants";
import { ProposalCardList } from "./ProposalCardList";
import { ProposalDetail } from "./ProposalDetail";
import { ProposalTable } from "./ProposalTable";

import type { CampaignProposal } from "@/entities/campaign-progress";
import type {
  FilterField,
  FilterValues,
} from "@/shared/components/list-filter";
import type { ReactNode } from "react";

interface MatchingStepProps {
  campaignIdx: number;
  /** 대화의 내 메시지 이름. */
  myName: string;
  /** 종료된 캠페인: 조회만. */
  isReadOnly: boolean;
  /** MO 서브 헤더(단계 이름). 이 단계는 헤더 오른쪽 버튼이 없음. */
  renderMobileHeader: (actions: ReactNode) => ReactNode;
}

const SKELETON_COLUMNS = [
  "w-4",
  "w-40",
  "w-6",
  "w-20",
  "w-14",
  "w-32",
  "w-20",
  "w-9",
  "w-16",
] as const;

const METRIC_KEYS = [
  "total",
  "proposed",
  "negotiating",
  "pendingPayment",
  "matched",
  "rejectedOrExpired",
] as const;

// 캠페인 진행의 크리에이터 매칭 목록(스펙 campaign/progress §3).
// 결제 화면은 아직 없어 준비 중 안내.
export function MatchingStep({
  campaignIdx,
  myName,
  isReadOnly,
  renderMobileHeader,
}: MatchingStepProps) {
  const { t } = useTranslation("features/campaign-matching");
  const { t: tCommon } = useTranslation();
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  // 연 줄. 목록을 다시 읽으면 새 값으로 바꿔 보이고, 필터로 목록에서 빠져도 창은 그대로 둠.
  const [opened, setOpened] = useState<CampaignProposal | null>(null);
  // 닫는 동안(드로어 애니메이션) 내용이 비지 않게 연 줄은 남기고 열림만 끔.
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const params = useMatchingParams();
  const { list, error, mutate } = useCampaignProposals({
    campaignIdx,
    status: params.status,
    keyword: params.keyword,
  });
  const now = useNow();

  const items = list?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(items.length / params.pageSize));
  const page = Math.min(params.page, totalPages);
  const visible = items.slice(
    (page - 1) * params.pageSize,
    page * params.pageSize,
  );
  const selection = useProposalSelection(visible, items);
  const detailProposal =
    opened &&
    (items.find((item) => item.proposalIdx === opened.proposalIdx) ?? opened);

  // 보이는 줄 중 가장 먼저 끝나는 기한이 지나면 목록을 다시 읽음(만료·자동 상태 변경 반영).
  const nextExpiry = getNextExpiryDelay(
    visible.map((p) => p.responseDeadline),
    now,
  );
  useEffect(() => {
    if (nextExpiry === null) return;
    const timer = setTimeout(() => void mutate(), nextExpiry + 1000);
    return () => clearTimeout(timer);
  }, [nextExpiry, mutate]);
  // 이미 받은 목록이 있으면 백그라운드 재조회 실패는 화면을 지우지 않음(SWR가 이전 값을 유지).
  if (error && !list) throw error;

  const fields: FilterField[] = [
    {
      type: "select",
      id: "status",
      label: t("filter.status"),
      placeholder: t("filter.status"),
      width: 120,
      options: PROPOSAL_STATUSES.map((status) => ({
        value: status,
        label: t(`status.${status}`),
      })),
    },
  ];
  const filterValues: FilterValues = params.status
    ? { status: params.status }
    : {};
  const showComingSoon = () => toast(tCommon("status.comingSoon"));
  const actions = {
    onOpenDetail: (proposal: CampaignProposal) => {
      setOpened(proposal);
      setIsDetailOpen(true);
    },
    onPay: showComingSoon,
    isReadOnly,
  };
  const emptyContent =
    list && items.length === 0 ? (
      <ListEmptyState
        kind={resolveEmptyKind(params.keyword, params.status !== null)}
        keyword={params.keyword}
        noneTitle={t("list.empty")}
      />
    ) : undefined;
  const selectedCount = selection.selectedIdxList.length;
  const detail = detailProposal && (
    <ProposalDetail
      key={detailProposal.proposalIdx}
      proposal={detailProposal}
      myName={myName}
      isReadOnly={isReadOnly}
      layout={isDesktop ? "desktop" : isTabletUp ? "tablet" : "mobile"}
      onClose={() => setIsDetailOpen(false)}
      onChanged={() => void mutate()}
      onPayNow={showComingSoon}
    />
  );

  // TAB·MO 상세는 목록 자리를 덮는 전체 화면(단계 헤더도 가림).
  if (detail && isDetailOpen && !isDesktop) {
    return <div className="flex min-h-0 flex-1 flex-col">{detail}</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {renderMobileHeader(null)}
      <ScrollPanel
        className="flex-1"
        contentClassName="flex flex-col ds-gap-6 px-4 pt-1 pb-5 tablet:ds-p-5"
      >
        <section className="flex flex-col ds-gap-4">
          <h2 className="hidden ds-text-base-none-semibold tablet:block">
            {t("title")}
          </h2>
          <Inform
            variant="filled"
            items={[
              { id: "payment", text: t("notice.payment") },
              { id: "fee", text: t("notice.fee") },
            ]}
          />
          <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-6">
            {METRIC_KEYS.map((key) => (
              <CountCard
                key={key}
                title={t(`metric.${key}`)}
                value={list ? list.counts[key] : "-"}
                unit={t("metric.unit")}
              />
            ))}
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <FilterToolbar
            fields={fields}
            values={filterValues}
            onChangeValues={(values) => params.setStatus(values.status ?? "")}
            onApplyFromDialog={(values) =>
              params.setStatus(values.status ?? "")
            }
            onRefresh={() => {
              params.reset();
              void mutate();
            }}
            isSearchInline
            search={{
              keyword: params.keyword,
              onSubmit: params.setKeyword,
              maxLength: SEARCH_MAX_LENGTH,
            }}
            pageSize={{
              value: params.pageSize,
              options: PAGE_SIZE_OPTIONS,
              onChange: params.setPageSize,
            }}
          />
          {!list ? (
            <SkeletonGroup>
              {isDesktop ? (
                <TableSkeleton
                  size="xs"
                  rowCount={params.pageSize}
                  columnClassNames={SKELETON_COLUMNS}
                />
              ) : (
                <Skeleton className="h-87 rounded-lg" />
              )}
            </SkeletonGroup>
          ) : isDesktop || emptyContent ? (
            <ProposalTable
              proposals={visible}
              selection={selection}
              now={now}
              emptyContent={emptyContent}
              {...actions}
            />
          ) : (
            <ProposalCardList
              proposals={visible}
              selection={selection}
              now={now}
              {...actions}
            />
          )}
          <ListPagination
            page={page}
            totalPages={totalPages}
            totalCount={items.length}
            buildHref={params.buildPageHref}
            onChangePage={params.setPage}
          />
        </section>
      </ScrollPanel>
      <div className="flex shrink-0 items-center justify-end gap-5 bg-background p-4 tablet:p-5">
        <p className="flex items-center gap-1 ds-text-sm-none-medium">
          <span className="font-semibold text-primary">{selectedCount}</span>
          {t("selection.count")}
        </p>
        <Button
          disabled={isReadOnly || selectedCount === 0}
          onClick={showComingSoon}
        >
          <CreditCard aria-hidden />
          {t("action.paySelected")}
        </Button>
      </div>
      {isDesktop && (
        <CreatorSheet
          isOpen={isDetailOpen}
          title={t("detail.title")}
          onClose={() => setIsDetailOpen(false)}
          className="w-202.5"
        >
          {detail}
        </CreatorSheet>
      )}
    </div>
  );
}

/** 남은 시간 표기를 1분마다 새로 그림. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
