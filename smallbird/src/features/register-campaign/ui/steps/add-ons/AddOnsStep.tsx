import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";

import { getAvailableAddOns } from "../../../model/add-ons";
import { useRegisterWizardStore } from "../../../model/wizard-context";

import type { CampaignAddOn } from "@/entities/campaign";

// 원고컨펌은 등록 때 결제하지 않고 매칭 때 매칭 인원당 결제(REQ-10-0049), 배지는 시안 원문.
export function AddOnsStep() {
  const { t } = useTranslation("features/register-campaign");
  const addOns = useRegisterWizardStore((state) => state.draft.addOns);
  const setStepDraft = useRegisterWizardStore((state) => state.setStepDraft);
  const productType = useRegisterWizardStore((state) => state.productType);
  const available = getAvailableAddOns(productType);

  function handleToggle(addOn: CampaignAddOn) {
    const next = addOns.includes(addOn)
      ? addOns.filter((selected) => selected !== addOn)
      : available.filter(
          (candidate) => candidate === addOn || addOns.includes(candidate),
        );
    setStepDraft("addOns", next);
  }

  return (
    <ul className="grid ds-gap-4 desktop:grid-cols-3">
      {available.map((addOn) => {
        const isSelected = addOns.includes(addOn);
        return (
          <li key={addOn} className="flex">
            <button
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              className={cn(
                "flex w-full cursor-pointer flex-col rounded-lg border bg-card text-left transition-[color,background-color,box-shadow] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isSelected && "ring-2 ring-primary ring-offset-2",
              )}
              onClick={() => handleToggle(addOn)}
            >
              <span className="flex flex-col items-center ds-gap-4 ds-px-5 ds-pt-5">
                <span className="ds-text-2xl-none-semibold">
                  {t(`addOns.${addOn}.name`)}
                </span>
                <Badge className="ds-text-sm-none-semibold">
                  {t(`addOns.${addOn}.price`)}
                </Badge>
                <Separator />
              </span>
              <span className="flex min-h-25 gap-1.5 ds-px-5 ds-pt-5 pb-1 ds-text-sm-5-normal">
                <span
                  aria-hidden
                  className="flex w-3 shrink-0 justify-center pt-2"
                >
                  <span className="block size-1.5 rounded-full bg-foreground" />
                </span>
                {t(`addOns.${addOn}.description`)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
