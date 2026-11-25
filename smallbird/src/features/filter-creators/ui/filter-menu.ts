// 시안 Select 트리거와 같은 모양. 플랫폼·카테고리는 고른 항목을 다시 눌러 해제해야 해서 Radix Select 대신 체크 메뉴로 만듦.
export const FILTER_TRIGGER_CLASS_NAME =
  "flex h-10 w-full items-center justify-between gap-4 rounded-md border border-input bg-background px-3 text-sm leading-5 whitespace-nowrap text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed data-[state=open]:ring-2 data-[state=open]:ring-primary data-[state=open]:ring-offset-2";

export const FILTER_MENU_ITEM_CLASS_NAME =
  "min-h-9 min-w-0 gap-2 leading-5 wrap-anywhere text-foreground";
