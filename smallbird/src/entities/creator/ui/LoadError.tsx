import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

export function LoadError({ onClickRetry }: { onClickRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <p className="ds-text-sm-5-medium text-muted-foreground">
        {t("error.unexpected")}
      </p>
      <Button variant="outline" onClick={onClickRetry}>
        {t("action.retry")}
      </Button>
    </div>
  );
}
