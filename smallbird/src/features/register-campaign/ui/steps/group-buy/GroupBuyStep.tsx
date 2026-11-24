import { useEffect } from "react";
import { toast } from "sonner";

import { useProductCategories } from "@/entities/campaign";
import { Inform } from "@/shared/components/inform";
import { useTranslation } from "@/shared/i18n";
import { Card } from "@/shared/ui/card";

import { GROUP_BUY_PRODUCT_NAME_MAX_LENGTH } from "../../../model/step-completion";
import { useRegisterWizardStore } from "../../../model/wizard-context";
import { AmountField } from "../../fields/AmountField";
import { OptionSelect } from "../../fields/OptionSelect";
import { TextInputField } from "../../fields/TextInputField";

// 공동구매 조건 설정. 제품명·권장소비자가는 2단계 협찬 제품 정보와 별개로 이 단계에서 입력받음.
// 분류 이름은 서버 값을 그대로 보여 주고(번역하지 않음), 대분류를 바꾸면 중분류를 비움.
export function GroupBuyStep() {
  const { t } = useTranslation("features/register-campaign");
  const { categories, error } = useProductCategories();
  const groupBuy = useRegisterWizardStore((state) => state.draft.groupBuy);
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );

  useEffect(() => {
    if (error) toast(t("toast.requestFailed"));
  }, [error, t]);

  const categoryOptions = (categories ?? []).map((category) => ({
    value: category.idx,
    label: category.name,
  }));
  const selectedCategory = categories?.find(
    (category) => category.idx === groupBuy.categoryIdx,
  );
  const middleCategoryOptions = (selectedCategory?.children ?? []).map(
    (child) => ({ value: child.idx, label: child.name }),
  );

  function handleChangeCategory(categoryIdx: number) {
    if (categoryIdx === groupBuy.categoryIdx) return;
    patchStepDraft("groupBuy", { categoryIdx, middleCategoryIdx: null });
  }

  return (
    <Card className="ds-gap-4 ds-p-6">
      <TextInputField
        label={t("groupBuy.productName.label")}
        maxLength={GROUP_BUY_PRODUCT_NAME_MAX_LENGTH}
        placeholder={t("groupBuy.productName.placeholder")}
        value={groupBuy.productName}
        onChangeValue={(productName) =>
          patchStepDraft("groupBuy", { productName })
        }
      />
      <div className="grid grid-cols-1 ds-gap-4 tablet:grid-cols-2 tablet:gap-6">
        <OptionSelect
          label={t("groupBuy.category.label")}
          placeholder={t("groupBuy.category.placeholder")}
          options={categoryOptions}
          value={groupBuy.categoryIdx}
          onChangeValue={handleChangeCategory}
        />
        <OptionSelect
          label={t("groupBuy.middleCategory.label")}
          placeholder={t("groupBuy.middleCategory.placeholder")}
          options={middleCategoryOptions}
          value={groupBuy.middleCategoryIdx}
          disabled={selectedCategory === undefined}
          onChangeValue={(middleCategoryIdx) =>
            patchStepDraft("groupBuy", { middleCategoryIdx })
          }
        />
        <AmountField
          label={t("groupBuy.recommendedPrice.label")}
          isRequired
          unit={t("unit.won")}
          placeholder={t("groupBuy.recommendedPrice.placeholder")}
          value={groupBuy.recommendedPrice}
          onChangeValue={(recommendedPrice) =>
            patchStepDraft("groupBuy", { recommendedPrice })
          }
        />
        <div className="flex flex-col ds-gap-4">
          <AmountField
            label={t("groupBuy.price.label")}
            isRequired
            unit={t("unit.won")}
            placeholder={t("groupBuy.price.placeholder")}
            value={groupBuy.price}
            onChangeValue={(price) => patchStepDraft("groupBuy", { price })}
          />
          <Inform
            hasLineTop
            items={[
              { id: "lowest-price", text: t("groupBuy.notice.lowestPrice") },
              { id: "may-change", text: t("groupBuy.notice.mayChange") },
            ]}
          />
        </div>
      </div>
    </Card>
  );
}
