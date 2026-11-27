import {
  InfiniteScrollSentinel,
  LoadMoreSpinner,
  ScrollToTopButton,
} from "@/shared/components/infinite-list";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { PaymentCardList } from "./PaymentCardList";

import type { PaymentRecord } from "@/entities/subscription";

interface PaymentScrollListProps {
  records: PaymentRecord[];
  hasMore: boolean;
  isLoadingMore: boolean;
  /** 이어 읽기에 실패함(먼저 읽은 목록은 남아 있음). */
  isLoadMoreError: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
}

// MO 목록: 쪽 이동 없이 스크롤 끝에서 다음 쪽을 이어 읽고 "맨 위로" 버튼을 둠.
export function PaymentScrollList({
  records,
  hasMore,
  isLoadingMore,
  isLoadMoreError,
  onLoadMore,
  onRetry,
}: PaymentScrollListProps) {
  const { t: tCommon } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <PaymentCardList records={records} />
      {isLoadingMore && <LoadMoreSpinner />}
      {isLoadMoreError && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onRetry}>
            {tCommon("action.retry")}
          </Button>
        </div>
      )}
      {/* 표식이 계속 화면 안에 있으면 관찰자가 다시 알리지 못해, 읽은 건수가 바뀔 때마다 새로 그림. */}
      {hasMore && !isLoadMoreError && (
        <InfiniteScrollSentinel key={records.length} onReach={onLoadMore} />
      )}
      <ScrollToTopButton label={tCommon("list.scrollTop")} />
    </div>
  );
}
