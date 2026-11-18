import { CircleAlert } from "lucide-react";

import { useTranslation } from "@/shared/i18n";

const NOTICE_KEYS = ["method", "validity", "instant", "delay"] as const;

export function ChargeNotice() {
  const { t } = useTranslation("features/bigbird-money-history");

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4 tablet:gap-4 tablet:p-5">
      <h2 className="text-base leading-none font-semibold text-foreground">
        {t("charge.notice.title")}
      </h2>
      <ul className="flex flex-col gap-2 text-sm leading-5 text-muted-foreground">
        {NOTICE_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-1.5">
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            {t(`charge.notice.${key}`)}
          </li>
        ))}
      </ul>
    </section>
  );
}
