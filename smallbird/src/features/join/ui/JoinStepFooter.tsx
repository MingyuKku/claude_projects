import { AuthButton, AuthText } from "@/shared/components/auth";
import { cn } from "@/shared/lib";

interface JoinStepFooterProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 단계 하단 주 버튼 영역. 모바일은 화면 아래에 고정되고(안쪽 본문만 스크롤), 태블릿 이상은 본문 아래를 따라감.
 * 버튼과 본문 사이 간격(태블릿 이상 48)은 본문 쪽 아래 여백이 맡고, 화면 바닥과의 여백만 여기서 줌.
 */
export function JoinStepFooter({
  label,
  onClick,
  disabled,
  className,
}: JoinStepFooterProps) {
  return (
    <div
      className={cn(
        "shrink-0 py-5 tablet:pt-0 tablet:pb-17.5 desktop:pb-30",
        className,
      )}
    >
      <div className="h-12">
        <AuthButton color="primary" onClick={onClick} disabled={disabled}>
          <AuthText as="span" size="fixed-base" tone="inherit">
            {label}
          </AuthText>
        </AuthButton>
      </div>
    </div>
  );
}
