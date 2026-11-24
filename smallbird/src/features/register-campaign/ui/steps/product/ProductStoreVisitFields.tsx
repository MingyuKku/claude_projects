import { FormField } from "@/shared/components/form-field";
import { TextField } from "@/shared/components/text-field";
import { useTranslation } from "@/shared/i18n";

import { VISIT_BENEFIT_MAX_LENGTH } from "../../../model/step-completion";
import { useRegisterWizardStore } from "../../../model/wizard-context";
import { AddressField } from "../../fields/AddressField";
import { ColumnFields } from "../../fields/ColumnFields";
import { TextInputField } from "../../fields/TextInputField";

/** 방문 매장명 최대 글자 수(API A-5.2). */
const STORE_NAME_MAX_LENGTH = 100;
/** 방문 쿠폰 인증번호 자릿수. */
const COUPON_CODE_LENGTH = 4;

/** 숫자만, 첫 자리 0은 받지 않음(서버가 숫자로 저장해 앞 0이 사라짐, API A-5.2). */
function toCouponCode(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/^0+/, "")
    .slice(0, COUPON_CODE_LENGTH);
}

// 매장방문형 2단계(시안 13320:115970). PC 2열(매장명·혜택 | 주소·쿠폰), TAB·MO 1열(매장명·주소·쿠폰·혜택). 매장 주소 아래 상세 주소 칸(3.0.5).
export function ProductStoreVisitFields() {
  const { t } = useTranslation("features/register-campaign");
  const product = useRegisterWizardStore((state) => state.draft.product);
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );

  function patch(value: Partial<typeof product>) {
    patchStepDraft("product", value);
  }

  const nameField = (
    <TextInputField
      label={t("product.store.nameLabel")}
      maxLength={STORE_NAME_MAX_LENGTH}
      placeholder={t("product.store.namePlaceholder")}
      value={product.storeName}
      onChangeValue={(storeName) => patch({ storeName })}
    />
  );

  const benefitField = (
    <FormField label={t("product.store.benefitLabel")} isRequired>
      {(control) => (
        <TextField
          {...control}
          variant="count"
          isWide
          // 시안 칸 높이 130(입력 88 + 카운터·여백).
          textareaClassName="h-22"
          maxLength={VISIT_BENEFIT_MAX_LENGTH}
          placeholder={t("product.store.benefitPlaceholder")}
          value={product.visitBenefit}
          onChange={(event) => patch({ visitBenefit: event.target.value })}
        />
      )}
    </FormField>
  );

  const addressField = (
    <AddressField
      label={t("product.store.addressLabel")}
      placeholder={t("product.store.addressPlaceholder")}
      value={product.storeAddress}
      onChangeValue={(storeAddress) => patch({ storeAddress })}
    />
  );

  const couponField = (
    <TextInputField
      label={t("product.store.couponLabel")}
      inputMode="numeric"
      placeholder={t("product.store.couponPlaceholder")}
      value={product.visitCouponCode}
      normalize={toCouponCode}
      onChangeValue={(visitCouponCode) => patch({ visitCouponCode })}
    />
  );

  return (
    <ColumnFields
      left={
        <>
          {nameField}
          {benefitField}
        </>
      }
      right={
        <>
          {addressField}
          {couponField}
        </>
      }
      stacked={
        <>
          {nameField}
          {addressField}
          {couponField}
          {benefitField}
        </>
      }
    />
  );
}
