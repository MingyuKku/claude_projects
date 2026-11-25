import { InfiniteScrollSentinel } from "@/shared/components/infinite-list";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

import type { LoadMoreView } from "../model/types";

interface LoadMoreFooterProps {
  list: LoadMoreView;
}

// 무한 스크롤 목록의 끝: 이어 읽는 중·실패 재시도·다음 쪽 표식.
export function LoadMoreFooter({ list }: LoadMoreFooterProps) {
  const { t } = useTranslation();

  return (
    <>
      {list.isLoadingMore && (
        <div className="flex justify-center py-4">
          <Spinner
            aria-label={t("status.loading")}
            className="size-4 text-foreground"
            strokeWidth={1.5}
          />
        </div>
      )}
      {list.isLoadMoreError && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={() => void list.reload()}>
            {t("action.retry")}
          </Button>
        </div>
      )}
      {/* 표식이 계속 화면 안에 있으면 관찰자가 다시 알리지 못해, 읽은 묶음 수가 바뀔 때마다 새로 그림. */}
      {list.hasMore && !list.isLoadMoreError && (
        <InfiniteScrollSentinel key={list.pageCount} onReach={list.loadMore} />
      )}
    </>
  );
}
