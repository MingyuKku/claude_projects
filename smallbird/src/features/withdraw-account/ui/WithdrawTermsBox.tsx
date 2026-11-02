import { TermsDocument } from "@/entities/terms";
import { cn } from "@/shared/lib/utils";

interface WithdrawTermsBoxProps {
  className?: string;
}

// 시안의 약관 박스(테두리·radius 6·안쪽 16, 본문 14/20). 약관 본문은 v2와 같은 서비스 이용약관(6조 회원탈퇴 포함, 스펙 §3).
// 넘치면 박스 안에서 스크롤함. 키보드 스크롤은 브라우저가 스크롤 영역에 주는 기본 포커스에 맡김(별도 tabIndex 없음).
export function WithdrawTermsBox({ className }: WithdrawTermsBoxProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col gap-5 overflow-y-auto rounded-md border border-input bg-background p-4",
        className,
      )}
    >
      <TermsDocument kind="service" />
    </div>
  );
}
