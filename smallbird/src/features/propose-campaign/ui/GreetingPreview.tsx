import { useTranslation } from "@/shared/i18n";

import { splitGreeting } from "../model/proposal-form";

interface GreetingPreviewProps {
  message: string;
  nickname: string;
  /** 일괄 제안은 사람마다 이름이 달라 이름 자리에 치환자를 보임. */
  isBatch: boolean;
}

export function GreetingPreview({
  message,
  nickname,
  isBatch,
}: GreetingPreviewProps) {
  const { t } = useTranslation("features/propose-campaign");

  const parts = splitGreeting(message, nickname);

  return (
    <section className="flex shrink-0 grow flex-col gap-4">
      <h3 className="ds-text-sm-none-semibold text-foreground">
        {t("preview.title")}
      </h3>
      <p className="grow rounded-md border bg-background p-4 text-base leading-7 wrap-anywhere whitespace-pre-line text-foreground">
        {parts ? (
          <>
            {parts.before}
            <strong className="font-bold">
              {isBatch ? t("preview.creatorToken") : nickname}
            </strong>
            {parts.after}
          </>
        ) : (
          message
        )}
      </p>
    </section>
  );
}
