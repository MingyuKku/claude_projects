import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import type { PointerEvent } from "react";

interface FullTextHintProps {
  text: string;
  className?: string;
}

// 긴 캠페인명은 두 줄까지 보이고 말줄임. 마우스를 올리거나(PC) 눌러서(MO·TAB 터치) 전체 이름을 보여 줌(사용자 결정).
// 호버는 마우스 포인터만 반응해 터치 스크롤 중에 열리지 않고, 터치는 눌러서 여닫으며 바깥을 누르면 닫힘.
export function FullTextHint({ text, className }: FullTextHintProps) {
  const [open, setOpen] = useState(false);

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
          type="button"
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          className={cn(
            "line-clamp-2 min-w-0 text-left break-all outline-none focus-visible:underline",
            className,
          )}
        >
          {text}
        </button>
      </PopoverTrigger>
      <PopoverContent
        // 호버로 여는 안내라 포커스를 가져오지 않음.
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="w-auto max-w-xs px-3 py-1.5 text-sm leading-5 break-all"
      >
        {text}
      </PopoverContent>
    </Popover>
  );
}
