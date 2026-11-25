import { FloatingButton } from "@/shared/components/floating-button";
import { useTranslation } from "@/shared/i18n";

interface RecommendAssistantButtonProps {
  onClick: () => void;
}

// 목록 영역(relative) 왼쪽 아래. MO는 하단 선택 바 위, TAB은 선택 바 줄에 겹침.
export function RecommendAssistantButton(props: RecommendAssistantButtonProps) {
  const { t } = useTranslation("features/recommend-creators");
  return (
    <FloatingButton
      aria-label={t("title")}
      className="absolute bottom-0 left-0 z-10 tablet:-bottom-14.5"
      {...props}
    />
  );
}
