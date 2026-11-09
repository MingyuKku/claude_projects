import { CAMPAIGN_ADD_ONS, useCampaignLabels } from "@/entities/campaign";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import { ADD_ON_PRICES } from "../../model/add-on-prices";
import { useCampaignRegisterStore } from "../../model/store-context";

import type { CampaignAddOn } from "@/entities/campaign";

// 4단계 부가서비스(Figma 모집형 7816:293631): 카드를 눌러 켜고 끔. PC는 3열, TAB·MO는 1열.
// PICK형은 AI 포스팅 가이드 하나뿐임(스펙 §3 4단계). 선택된 카드는 시안에 없어 토글과 같은 눌린(Pressed) 모양(D-2).
// 위 안내 박스는 단계 제목 위에 놓여 `AddOnsNotice`가 따로 그림.
export function AddOnsStep() {
  const serviceType = useCampaignRegisterStore(
    (state) => state.draft.serviceType,
  );
  const addOns = useCampaignRegisterStore((state) => state.draft.addOns);
  const setAddOns = useCampaignRegisterStore((state) => state.setAddOns);
  const available =
    serviceType === "PICK"
      ? CAMPAIGN_ADD_ONS.filter((addOn) => addOn === "AI_POSTING_GUIDE")
      : CAMPAIGN_ADD_ONS;

  // 켠 순서와 상관없이 정해진 순서로 저장함.
  function handleToggle(addOn: CampaignAddOn) {
    const next = new Set(addOns);
    if (!next.delete(addOn)) next.add(addOn);
    setAddOns(CAMPAIGN_ADD_ONS.filter((code) => next.has(code)));
  }

  return (
    <div className="grid grid-cols-1 gap-4 desktop:grid-cols-3">
      {available.map((addOn) => (
        <AddOnCard
          key={addOn}
          addOn={addOn}
          isSelected={addOns.includes(addOn)}
          onToggle={() => handleToggle(addOn)}
        />
      ))}
    </div>
  );
}

interface AddOnCardProps {
  addOn: CampaignAddOn;
  isSelected: boolean;
  onToggle: () => void;
}

function AddOnCard({ addOn, isSelected, onToggle }: AddOnCardProps) {
  const { t } = useTranslation("features/register-campaign");
  const labels = useCampaignLabels();
  const price = ADD_ON_PRICES[addOn];
  const amount = formatNumber(price.amount);

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={cn(
        "flex min-h-55 min-w-0 flex-col overflow-clip rounded-lg border bg-card text-left transition-colors outline-none",
        "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-default disabled:hover:bg-card aria-pressed:bg-muted disabled:aria-pressed:hover:bg-muted",
      )}
      onClick={onToggle}
    >
      <span className="flex w-full flex-col items-center gap-4 px-5 pt-5">
        <span className="text-2xl leading-none font-semibold tracking-tight text-card-foreground">
          {labels.addOn(addOn)}
        </span>
        <span className="rounded-md bg-blue-200 px-2.5 py-2 text-sm leading-none font-semibold text-blue-600">
          {price.unit === "TOTAL"
            ? t("addOns.price.total", { amount })
            : t("addOns.price.perInfluencer", { amount })}
        </span>
        <span aria-hidden className="h-px w-full bg-border" />
      </span>
      <span className="flex items-start gap-1.5 px-5 pt-5">
        <span aria-hidden className="flex h-5 shrink-0 items-center">
          <span className="size-1.25 rounded-full bg-foreground" />
        </span>
        <span className="min-w-0 flex-1 text-sm leading-5 text-foreground">
          {t(`addOns.description.${addOn}`)}
        </span>
      </span>
    </button>
  );
}
