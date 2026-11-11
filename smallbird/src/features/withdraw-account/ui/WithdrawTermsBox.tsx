import { TermsDocument } from "@/entities/terms";
import { cn } from "@/shared/lib/utils";
import { ScrollArea } from "@/shared/ui/scroll-area";

interface WithdrawTermsBoxProps {
  className?: string;
}

// 시안의 약관 박스(테두리·radius 6·안쪽 16, 본문 14/20). 약관 본문은 v2와 같은 서비스 이용약관(6조 회원탈퇴 포함, 스펙 §3).
// 스크롤바는 시안의 Scroll-area(디자인 QA 26/11/05 - TAB - 39)라서 디자인 시스템의 `ScrollArea`로 그림: 내용 위에 겹쳐 자리를 차지하지 않고 어느 브라우저에서나 같음.
// 높이는 쓰는 쪽이 정함(MO 전체 화면은 남은 높이, 다이얼로그는 고정 높이). 정하지 않으면 내용만큼 늘어남. Radix 안쪽 래퍼(display: table)가 긴 글을 줄바꿈하지 않아 block으로 되돌림.
export function WithdrawTermsBox({ className }: WithdrawTermsBoxProps) {
  return (
    <ScrollArea
      type="auto"
      className={cn(
        "min-h-0 rounded-md border border-input bg-background [&_[data-slot=scroll-area-viewport]>div]:block!",
        className,
      )}
    >
      <div className="flex flex-col gap-5 p-4">
        <TermsDocument kind="service" />
      </div>
    </ScrollArea>
  );
}
