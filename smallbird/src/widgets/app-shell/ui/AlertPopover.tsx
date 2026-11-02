import { useState } from "react";

import { AlertList } from "@/shared/components/alert-list";
import { HeaderAlertButton } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import type { AlertListItemData } from "@/shared/components/alert-list";

// Figma Alert List(빈 상태 7318:176591, 목록 8711:139090). 알림 API 연동 전까지 목록은 항상 비어 있음.
const NO_ALERTS: AlertListItemData[] = [];

// 모바일(MO / Main Screen / Log-In 7318:175091)은 헤더 바로 아래를 꽉 채우는 패널(좌우 여백·둥근 모서리 없음)이고,
// tablet(768) 이상은 벨 아래 320px 팝오버. w-screen 패널은 Radix가 화면 안으로 밀어 왼쪽 끝에 맞춤.
const PANEL_CLASS_NAME = "w-screen rounded-none tablet:w-80 tablet:rounded-lg";

// 알림이 이 개수를 넘으면 스크롤함. tablet 이상은 5개 분량(Figma 목록 554px)으로 고정하고,
// 모바일은 헤더 아래부터 화면 하단까지 채움. 기준 개수는 임시.
const MAX_VISIBLE_ALERTS = 5;
const FIT_SCREEN_CLASS_NAME =
  "max-h-(--radix-popover-content-available-height)";
const SCROLL_LIST_CLASS_NAME =
  "h-(--radix-popover-content-available-height) tablet:h-138.5";

export function AlertPopover() {
  const { t } = useTranslation("widgets/app-shell");
  const [isOpen, setIsOpen] = useState(false);

  const items = NO_ALERTS;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <HeaderAlertButton
          label={t("header.alerts")}
          unreadLabel={t("header.alertsUnread")}
          hasUnread={items.some((item) => !item.isRead)}
        />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={0}
        className="w-auto border-0 bg-transparent p-0 shadow-none"
      >
        <AlertList
          title={t("alertPanel.title")}
          closeLabel={t("alertPanel.close")}
          onClickClose={() => setIsOpen(false)}
          items={items}
          emptyTitle={t("alertPanel.emptyTitle")}
          emptyDescription={t("alertPanel.emptyDescription")}
          className={cn(
            PANEL_CLASS_NAME,
            FIT_SCREEN_CLASS_NAME,
            items.length > MAX_VISIBLE_ALERTS && SCROLL_LIST_CLASS_NAME,
          )}
        />
      </PopoverContent>
    </Popover>
  );
}
