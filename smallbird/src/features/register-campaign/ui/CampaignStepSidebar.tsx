import { StepSidebar } from "@/shared/components/step-sidebar";
import { useTranslation } from "@/shared/i18n";

import { isStepSlug } from "../model/steps";
import {
  SUMMARY_ID,
  useStepSidebarItems,
} from "../model/use-step-sidebar-items";

interface CampaignStepSidebarProps {
  /** 항목 안쪽 여백. md는 PC·TAB 사이드바, sm은 모바일 드로어. */
  size?: "md" | "sm";
  /** 단계를 고른 뒤(이동이 끝나기 전) 부르는 곳. 드로어를 닫을 때 씀. */
  onSelected?: () => void;
  className?: string;
}

// 단계 사이드바(Figma Sidebar / Sub). 어느 단계로든 건너뛸 수 있고, 이동할 때 검사·알럿 없이 저장만 함.
export function CampaignStepSidebar({
  size = "md",
  onSelected,
  className,
}: CampaignStepSidebarProps) {
  const { t } = useTranslation("features/register-campaign");
  const { items, moveToStep, header, finishEdit } = useStepSidebarItems();

  function handleSelect(id: string) {
    if (id === SUMMARY_ID) {
      onSelected?.();
      void finishEdit();
      return;
    }
    if (!isStepSlug(id)) return;
    onSelected?.();
    void moveToStep(id);
  }

  return (
    <StepSidebar
      navLabel={t("sidebar.label")}
      size={size}
      items={items}
      header={header}
      onSelect={handleSelect}
      className={className}
    />
  );
}
