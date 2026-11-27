import { ScrollableTabsList } from "@/shared/components/scrollable-tabs-list";
import { useTranslation } from "@/shared/i18n";
import { Tabs, TabsTrigger } from "@/shared/ui/tabs";

import { STATUS_TABS } from "../model/constants";

import type { StatusTab } from "../model/constants";

interface StatusTabsProps {
  value: StatusTab;
  onChange: (tab: string) => void;
}

// 진행 단계 탭(Figma Tabs Type=Line). 좁은 화면에서는 탭이 줄어들지 않고 화면 끝까지 가로로 스크롤함(부모 여백 ds-px-5를 넘어감).
export function StatusTabs({ value, onChange }: StatusTabsProps) {
  const { t } = useTranslation("pages/campaign-status");

  return (
    <Tabs value={value} onValueChange={onChange} className="gap-0">
      <ScrollableTabsList variant="line" bleed="mobile" gutter="var(--ds-p-5)">
        {STATUS_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="flex-none">
            {t(`tab.${tab}`)}
          </TabsTrigger>
        ))}
      </ScrollableTabsList>
    </Tabs>
  );
}
