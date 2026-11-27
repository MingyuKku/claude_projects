import { cva } from "class-variance-authority";

import { useScrollActiveTabIntoView } from "@/shared/lib/useScrollActiveTabIntoView";
import { cn } from "@/shared/lib/utils";
import { TabsList } from "@/shared/ui/tabs";

import type { CssVariableStyle } from "@/shared/lib/css-variable-style";
import type { ComponentProps } from "react";

/**
 * 스크롤 영역을 부모 좌우 여백 바깥(화면 끝)까지 넓힐 범위.
 * - `none`: 부모 여백 안에서만 스크롤하고 잘림
 * - `mobile`: MO에서만 화면 끝까지 스크롤하고, TAB 이상은 여백 안
 * - `always`: 모든 폭에서 화면 끝까지
 */
export type ScrollableTabsBleed = "none" | "mobile" | "always";

// 넓힌 만큼 목록에 안쪽 여백을 줘 첫 탭과 밑줄 시작은 콘텐츠 선에 맞춤.
const scrollAreaVariants = cva("scrollbar-hidden overflow-x-auto", {
  variants: {
    bleed: {
      none: "",
      mobile: "-mx-(--tabs-gutter) tablet:mx-0",
      always: "-mx-(--tabs-gutter)",
    },
  },
});

const listVariants = cva("w-full min-w-max justify-start", {
  variants: {
    bleed: {
      none: "",
      mobile: "px-(--tabs-gutter) tablet:px-0",
      always: "px-(--tabs-gutter)",
    },
  },
});

type BleedProps =
  | { bleed?: "none"; gutter?: never }
  | {
      bleed: Exclude<ScrollableTabsBleed, "none">;
      /** 넘어갈 부모 좌우 여백(CSS 길이, 예: `var(--ds-p-5)`). */
      gutter: string;
    };

type ScrollableTabsListProps = ComponentProps<typeof TabsList> &
  BleedProps & {
    /** 스크롤 영역 요소의 className(목록 className은 `className`). */
    scrollAreaClassName?: string;
    /** 선택 탭을 보이게 옮길 때 가장자리에서 띄울 간격(px). 기본은 목록의 안쪽 여백. */
    inset?: number;
  };

/**
 * 탭이 줄어들지 않고 가로로 넘치면 스크롤하는 탭 목록. `<Tabs>` 안에 두고 `TabsTrigger`에는 `flex-none`을 줌.
 * 선택한 탭이 잘리거나 화면 밖에 있으면 보이는 위치까지 스크롤함.
 */
export function ScrollableTabsList({
  bleed = "none",
  gutter,
  scrollAreaClassName,
  inset,
  className,
  ...props
}: ScrollableTabsListProps) {
  const scrollRef = useScrollActiveTabIntoView<HTMLDivElement>({ inset });
  const style: CssVariableStyle | undefined = gutter
    ? { "--tabs-gutter": gutter }
    : undefined;

  return (
    <div
      ref={scrollRef}
      style={style}
      className={cn(scrollAreaVariants({ bleed }), scrollAreaClassName)}
    >
      <TabsList className={cn(listVariants({ bleed }), className)} {...props} />
    </div>
  );
}
