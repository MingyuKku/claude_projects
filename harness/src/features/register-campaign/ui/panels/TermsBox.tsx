import { TermsDocument } from "@/entities/terms";
import { ScrollArea } from "@/shared/ui/scroll-area";

import type { RegisterTermsKind } from "../../model/use-register-panel";

interface TermsBoxProps {
  kind: RegisterTermsKind;
}

// 스크롤바는 시안 Scroll-area라 `ScrollArea`로 그리고,
// Radix 안쪽 래퍼(display: table)는 긴 글을 줄바꿈하지 않아 block으로 되돌림(충전 약관과 같음).
export function TermsBox({ kind }: TermsBoxProps) {
  return (
    <ScrollArea
      type="auto"
      className="min-h-0 flex-1 rounded-md border border-input bg-background [&_[data-slot=scroll-area-viewport]>div]:block!"
    >
      <div className="flex flex-col gap-5 p-4">
        <TermsDocument kind={kind} />
      </div>
    </ScrollArea>
  );
}
