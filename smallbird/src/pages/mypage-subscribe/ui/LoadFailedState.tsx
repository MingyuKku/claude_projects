import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

interface LoadFailedStateProps {
  onRetry: () => void;
  className?: string;
}

/** 탭 본문을 읽지 못했을 때의 공통 안내(다시 시도). */
export function LoadFailedState({ onRetry, className }: LoadFailedStateProps) {
  const { t: tCommon } = useTranslation();

  return (
    <EmptyState
      type="alarm"
      title={tCommon("error.unexpected")}
      className={className ?? "py-20"}
      action={
        <Button variant="outline" onClick={onRetry}>
          {tCommon("action.retry")}
        </Button>
      }
    />
  );
}
