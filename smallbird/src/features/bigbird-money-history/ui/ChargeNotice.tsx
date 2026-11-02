import { CircleAlert } from "lucide-react";

import { useTranslation } from "@/shared/i18n";

const NOTICE_KEYS = ["method", "validity", "instant", "delay"] as const;

// 충전 안내 카드(Figma "안내", 4행). 보유 머니 카드 옆에 놓음(MO는 세그먼트 "충전"). 문구는 스펙 §3.
export function ChargeNotice() {
  const { t } = useTranslation("features/bigbird-money-history");

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-5">
      <h2 className="text-base leading-6 font-semibold text-foreground">
        {t("charge.notice.title")}
      </h2>
      <ul className="flex flex-col gap-2 text-sm leading-5 text-muted-foreground">
        {NOTICE_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-2">
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            {t(`charge.notice.${key}`)}
          </li>
        ))}
      </ul>
    </section>
  );
}
