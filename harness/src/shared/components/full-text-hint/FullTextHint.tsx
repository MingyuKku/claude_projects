import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import { useIsTruncated } from "./use-is-truncated";

import type { PointerEvent } from "react";

// Tailwind가 클래스를 찾을 수 있게 완전한 이름으로 둠.
const LINE_CLAMP_CLASS_NAME = { 1: "line-clamp-1", 2: "line-clamp-2" } as const;

interface FullTextHintProps {
  text: string;
  /** 보여 줄 최대 줄 수. 기본 1. */
  lines?: keyof typeof LINE_CLAMP_CLASS_NAME;
  className?: string;
}

// 긴 이름은 `lines`줄(기본 한 줄)까지 보이고 넘치면 말줄임. 글자 단위로 줄바꿈한 뒤 한 줄만 보여 표·카드 칸이 얼마든 좁아질 수 있음
// (한 줄 고정(nowrap)이면 자동 표 배치에서 열이 이름 길이만큼 늘어남). 잘린 이름만 마우스를 올리거나(PC) 눌러서(MO·TAB 터치) 전체 이름을 보여 줌.
// 호버는 마우스 포인터만 반응해 터치 스크롤 중에 열리지 않고, 터치는 눌러서 여닫으며 바깥을 누르면 닫힘.
// 다 보이는 이름은 그냥 글자로 그려 버튼·포커스·손가락 커서를 두지 않음(눌러도 아무 일이 없는 버튼이 되므로).
export function FullTextHint({
  text,
  lines = 1,
  className,
}: FullTextHintProps) {
  const [open, setOpen] = useState(false);
  // 잘렸는지 재려면 그려진 요소가 필요해 ref 대신 state로 잡음(요소가 바뀌어도 다시 구독함).
  const [element, setElement] = useState<HTMLElement | null>(null);
  const isTruncated = useIsTruncated(element);
  const textClassName = cn(
    LINE_CLAMP_CLASS_NAME[lines],
    "w-full min-w-0 text-left break-all",
    className,
  );

  if (!isTruncated) {
    return (
      <span ref={setElement} className={textClassName}>
        {text}
      </span>
    );
  }

  function handlePointerEnter(event: PointerEvent) {
    if (event.pointerType === "mouse") setOpen(true);
  }

  function handlePointerLeave(event: PointerEvent) {
    if (event.pointerType === "mouse") setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={setElement}
          type="button"
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          // 전역 CSS가 button에 주는 손가락 커서를 끔: PC는 올려서 보는 안내라 누르는 동작이 아님.
          className={cn(
            textClassName,
            "cursor-default outline-none focus-visible:underline",
          )}
        >
          {text}
        </button>
      </PopoverTrigger>
      <PopoverContent
        // 호버로 여는 안내라 포커스를 가져오지 않음.
        onOpenAutoFocus={(event) => event.preventDefault()}
        // 열리는 애니메이션(위에서 내려옴)이 이름 아래쪽을 잠깐 덮어, 그 자리의 포인터를 가져가면 닫혔다 다시 열리기를
        // 반복함. 읽기만 하는 안내라 포인터를 받지 않게 함.
        className="pointer-events-none w-auto max-w-xs px-3 py-1.5 text-sm leading-5 break-all"
      >
        {text}
      </PopoverContent>
    </Popover>
  );
}
