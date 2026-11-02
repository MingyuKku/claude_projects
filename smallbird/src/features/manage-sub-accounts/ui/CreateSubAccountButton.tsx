import { Plus } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

interface CreateSubAccountButtonProps {
  onClick: () => void;
  className?: string;
}

// Figma "Sub ID 생성" 버튼(+ 아이콘, primary). PC·TAB은 목록 머리에, MO는 페이지가 화면 하단에 고정해 그림.
export function CreateSubAccountButton({
  onClick,
  className,
}: CreateSubAccountButtonProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  return (
    <Button className={className} onClick={onClick}>
      <Plus />
      {t("list.create")}
    </Button>
  );
}
