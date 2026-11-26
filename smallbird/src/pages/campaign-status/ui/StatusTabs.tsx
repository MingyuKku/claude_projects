import { useTranslation } from "@/shared/i18n";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { STATUS_TABS } from "../model/constants";

import type { StatusTab } from "../model/constants";

interface StatusTabsProps {
  value: StatusTab;
  onChange: (tab: string) => void;
}

// 진행 단계 탭(Figma Tabs Type=Line). 좁은 화면에서는 탭이 줄어들지 않고 가로로 스크롤함.
export function StatusTabs({ value, onChange }: StatusTabsProps) {
  const { t } = useTranslation("pages/campaign-status");

  return (
    <Tabs value={value} onValueChange={onChange} className="gap-0">
      <div className="scrollbar-hidden overflow-x-auto">
        <TabsList variant="line" className="w-full min-w-max justify-start">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="flex-none">
              {t(`tab.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
