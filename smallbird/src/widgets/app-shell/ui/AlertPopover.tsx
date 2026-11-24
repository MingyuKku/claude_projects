import { useState } from "react";

import {
  useMarkNotificationRead,
  useNotifications,
} from "@/entities/notification";
import { AlertList } from "@/shared/components/alert-list";
import { HeaderAlertButton } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import type { NotificationItem } from "@/entities/notification";
import type { AlertListItemData } from "@/shared/components/alert-list";

// Figma Alert List(빈 상태 7318:176591, 목록 8711:139090).
const NO_ALERTS: AlertListItemData[] = [];

// 모바일(MO / Main Screen / Log-In 7318:175091)은 헤더 바로 아래를 꽉 채우는 패널(좌우 여백·둥근 모서리 없음)이고,
// tablet(768) 이상은 벨 아래 320px 팝오버. w-screen 패널은 Radix가 화면 안으로 밀어 왼쪽 끝에 맞춤.
const PANEL_CLASS_NAME = "w-screen rounded-none tablet:w-80 tablet:rounded-lg";

// 알림이 이 개수를 넘으면 스크롤함. tablet 이상은 5개 분량(Figma 목록 554px)으로 고정하고,
// 모바일은 헤더 아래부터 화면 하단까지 채움. 기준 개수는 임시.
const MAX_VISIBLE_ALERTS = 5;

const ALERT_TYPE = {
  approved: "success",
  rejected: "destructive",
} as const;

const FIT_SCREEN_CLASS_NAME =
  "max-h-(--radix-popover-content-available-height)";
const SCROLL_LIST_CLASS_NAME =
  "h-(--radix-popover-content-available-height) tablet:h-138.5";

interface AlertPopoverProps {
  /** 알림을 받는 계정(MASTER·ADMIN)인지. 아니면 목록을 읽지 않고 항상 "새로운 알림 없음". */
  canReceive: boolean;
}

export function AlertPopover({ canReceive }: AlertPopoverProps) {
  const { t } = useTranslation("widgets/app-shell");
  const [isOpen, setIsOpen] = useState(false);
  const { data } = useNotifications(canReceive);
  const markRead = useMarkNotificationRead();

  const items = data
    ? data.items.map((item) => toAlertItem(item, t))
    : NO_ALERTS;
  // 점은 패널을 열기 전에도 보여야 해서 목록이 아니라 서버가 센 전체 안 읽은 개수를 씀.
  const hasUnread = (data?.unreadCount ?? 0) > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <HeaderAlertButton
          label={t("header.alerts")}
          unreadLabel={t("header.alertsUnread")}
          hasUnread={hasUnread}
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
          onClickItem={(id) => void markRead(Number(id))}
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

type Translate = ReturnType<typeof useTranslation<"widgets/app-shell">>["t"];

function toAlertItem(item: NotificationItem, t: Translate): AlertListItemData {
  const title = t(`alertPanel.item.${item.kind}.title`);
  return {
    id: String(item.id),
    type: ALERT_TYPE[item.kind],
    title,
    // 캠페인명이 없으면 제목과 같은 문구만 보임.
    description: item.campaignName
      ? t(`alertPanel.item.${item.kind}.description`, {
          name: item.campaignName,
        })
      : title,
    date: item.date,
    time: item.time,
    isRead: item.isRead,
  };
}
