import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";

import { POLICY_ITEMS } from "../../../model/policy-items";
import { useCampaignRegisterStore } from "../../../model/store-context";
import { PolicyTermsDialog } from "./PolicyTermsDialog";

import type { PolicyItem } from "../../../model/policy-items";

// 약관 동의 목록(Figma 7555:334641): "약관 전체 동의" 행 + 필수 4개. 7단계와 8단계가 같은 값을 보이고 어느 쪽에서 고쳐도 반영됨.
// - 전체 동의는 4개를 한꺼번에 켜고 끄고, 4개가 모두 켜지면 전체도 켜짐(일부만 켜지면 부분 선택).
// - 항목의 ">"는 약관 전문을 엽니다. 전문이 없는 두 정책은 ">"를 숨기고 체크만 받음.
export function PolicyAgreementList({ idPrefix }: { idPrefix: string }) {
  const { t } = useTranslation("features/register-campaign");
  const agreements = useCampaignRegisterStore(
    (state) => state.draft.policy.agreements,
  );
  const patchAgreements = useCampaignRegisterStore(
    (state) => state.patchAgreements,
  );
  const [openedItem, setOpenedItem] = useState<PolicyItem | null>(null);

  const checkedCount = POLICY_ITEMS.filter(
    (item) => agreements[item.key],
  ).length;
  const isAll = checkedCount === POLICY_ITEMS.length;

  function handleChangeAll(checked: boolean) {
    patchAgreements(
      Object.fromEntries(POLICY_ITEMS.map((item) => [item.key, checked])),
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-12 items-center gap-2 rounded-md bg-muted px-4">
        <Checkbox
          id={`${idPrefix}-all`}
          checked={isAll ? true : checkedCount > 0 ? "indeterminate" : false}
          onCheckedChange={(checked) => handleChangeAll(checked === true)}
        />
        <Label htmlFor={`${idPrefix}-all`} className="flex-1 font-semibold">
          {t("policy.all")}
        </Label>
      </div>
      <ul className="flex flex-col gap-1">
        {POLICY_ITEMS.map((item) => {
          const title = t(`policy.items.${item.key}.title`);
          return (
            <li key={item.key} className="flex min-h-8 items-center gap-2 pl-4">
              <Checkbox
                id={`${idPrefix}-${item.key}`}
                checked={agreements[item.key]}
                onCheckedChange={(checked) =>
                  patchAgreements({ [item.key]: checked === true })
                }
              />
              <Label
                htmlFor={`${idPrefix}-${item.key}`}
                className="flex-1 gap-0.5"
              >
                {t(`policy.items.${item.key}.label`)}
                <span aria-hidden="true" className="font-semibold text-primary">
                  *
                </span>
              </Label>
              {item.termsKind && (
                <Button
                  type="button"
                  variant="ghost-muted"
                  size="icon-xss"
                  aria-label={t("policy.view", { title })}
                  onClick={() => setOpenedItem(item)}
                >
                  <ChevronRight />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <PolicyTermsDialog
        item={openedItem}
        onClose={() => setOpenedItem(null)}
        onAgree={(item) => {
          patchAgreements({ [item.key]: true });
          setOpenedItem(null);
        }}
      />
    </div>
  );
}
