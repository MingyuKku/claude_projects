import { createEmptyProductDraft } from "@/entities/campaign";
import { FormField } from "@/shared/components/form-field";
import { Inform } from "@/shared/components/inform";
import { useTranslation } from "@/shared/i18n";
import { Input } from "@/shared/ui/input";

import { RENTAL_MIN_PRODUCT_PRICE } from "../../../model/step-completion";
import { useRegisterWizardStore } from "../../../model/wizard-context";
import { AddressField } from "../../fields/AddressField";
import { AmountField } from "../../fields/AmountField";
import { ChoiceField } from "../../fields/ChoiceField";
import { ColumnFields } from "../../fields/ColumnFields";
import { TextInputField } from "../../fields/TextInputField";

/** 협찬제품명·연락처 최대 글자 수(API A-5.2). */
const PRODUCT_NAME_MAX_LENGTH = 100;
const CONTACT_MAX_LENGTH = 50;

/** 연락처는 숫자·하이픈만 받음. */
function toContact(value: string) {
  return value.replace(/[^0-9-]/g, "");
}

// 제품발송형 2단계(시안 13320:115843 기본·115880 회수 있음·115922 대여). PC 2열(제품·반품 회수 | 금액·대여), TAB·MO 1열(제품·금액·반품 회수·대여).
// 반품 회수 여부는 필수이고 "회수 안함"으로 시작함. "대여 상품"은 협찬제품 금액이 100만원 이상일 때만 고를 수 있고,
// 금액이 내려가면 "일반 상품"으로 되돌리며 대여 입력을 비움(시안 주석·스펙 §3 2단계).
export function ProductDeliveryFields() {
  const { t } = useTranslation("features/register-campaign");
  const product = useRegisterWizardStore((state) => state.draft.product);
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );

  const canChooseRental =
    product.productPrice !== null &&
    product.productPrice >= RENTAL_MIN_PRODUCT_PRICE;

  function patch(value: Partial<typeof product>) {
    patchStepDraft("product", value);
  }

  function handleChangePrice(productPrice: number | null) {
    const isRentalAllowed =
      productPrice !== null && productPrice >= RENTAL_MIN_PRODUCT_PRICE;
    if (product.rental && !isRentalAllowed) {
      const empty = createEmptyProductDraft();
      patch({
        productPrice,
        rental: false,
        rentalReturnAddress: empty.rentalReturnAddress,
        rentalReturnShippingFee: empty.rentalReturnShippingFee,
        rentalReturnContact: empty.rentalReturnContact,
      });
      return;
    }
    patch({ productPrice });
  }

  const nameField = (
    <FormField label={t("product.delivery.nameLabel")} isRequired>
      {(control) => (
        <div className="flex flex-col gap-2">
          <Input
            {...control}
            value={product.productName}
            maxLength={PRODUCT_NAME_MAX_LENGTH}
            placeholder={t("product.delivery.namePlaceholder")}
            onChange={(event) => patch({ productName: event.target.value })}
          />
          <AmountField
            aria-label={t("product.delivery.quantityLabel")}
            unit={t("unit.count")}
            placeholder={t("product.delivery.quantityPlaceholder")}
            value={product.quantityPerCreator}
            onChangeValue={(quantityPerCreator) =>
              patch({ quantityPerCreator })
            }
          />
        </div>
      )}
    </FormField>
  );

  const priceField = (
    <AmountField
      label={t("product.delivery.priceLabel")}
      isRequired
      unit={t("unit.won")}
      placeholder={t("product.delivery.pricePlaceholder")}
      value={product.productPrice}
      onChangeValue={handleChangePrice}
    />
  );

  const returnFields = (
    <>
      <ChoiceField
        label={t("product.return.label")}
        value={product.returnRequired ? "yes" : "no"}
        options={[
          { value: "no", label: t("product.return.no") },
          { value: "yes", label: t("product.return.yes") },
        ]}
        onChangeValue={(value) => patch({ returnRequired: value === "yes" })}
      />
      <Inform
        hasLineTop
        items={[{ id: "return", text: t("product.return.notice") }]}
      />
      {product.returnRequired && (
        <>
          <AddressField
            label={t("product.return.addressLabel")}
            placeholder={t("product.return.addressPlaceholder")}
            value={product.returnAddress}
            onChangeValue={(returnAddress) => patch({ returnAddress })}
          />
          <div className="grid gap-4 tablet:grid-cols-2">
            <AmountField
              label={t("product.return.feeLabel")}
              isRequired
              unit={t("unit.won")}
              placeholder={t("product.return.feePlaceholder")}
              value={product.returnShippingFee}
              onChangeValue={(returnShippingFee) =>
                patch({ returnShippingFee })
              }
            />
            <TextInputField
              label={t("product.return.contactLabel")}
              inputMode="tel"
              maxLength={CONTACT_MAX_LENGTH}
              placeholder={t("product.contactPlaceholder")}
              value={product.returnContact}
              normalize={toContact}
              onChangeValue={(returnContact) => patch({ returnContact })}
            />
          </div>
        </>
      )}
    </>
  );

  const rentalFields = (
    <>
      <ChoiceField
        label={t("product.rental.label")}
        value={product.rental ? "rental" : "general"}
        options={[
          { value: "general", label: t("product.rental.general") },
          {
            value: "rental",
            label: t("product.rental.rental"),
            disabled: !canChooseRental,
          },
        ]}
        onChangeValue={(value) => patch({ rental: value === "rental" })}
      />
      <Inform
        hasLineTop
        items={[
          { id: "price", text: t("product.rental.noticePrice") },
          { id: "return", text: t("product.rental.noticeReturn") },
        ]}
      />
      {product.rental && (
        <>
          <AddressField
            label={t("product.rental.addressLabel")}
            placeholder={t("product.return.addressPlaceholder")}
            value={product.rentalReturnAddress}
            onChangeValue={(rentalReturnAddress) =>
              patch({ rentalReturnAddress })
            }
          />
          <div className="grid gap-4 tablet:grid-cols-2">
            <AmountField
              label={t("product.rental.feeLabel")}
              isRequired
              unit={t("unit.won")}
              placeholder={t("product.rental.feePlaceholder")}
              value={product.rentalReturnShippingFee}
              onChangeValue={(rentalReturnShippingFee) =>
                patch({ rentalReturnShippingFee })
              }
            />
            <TextInputField
              label={t("product.rental.contactLabel")}
              inputMode="tel"
              maxLength={CONTACT_MAX_LENGTH}
              placeholder={t("product.contactPlaceholder")}
              value={product.rentalReturnContact}
              normalize={toContact}
              onChangeValue={(rentalReturnContact) =>
                patch({ rentalReturnContact })
              }
            />
          </div>
        </>
      )}
    </>
  );

  return (
    <ColumnFields
      left={
        <>
          {nameField}
          {returnFields}
        </>
      }
      right={
        <>
          {priceField}
          {rentalFields}
        </>
      }
      stacked={
        <>
          {nameField}
          {priceField}
          {returnFields}
          {rentalFields}
        </>
      }
    />
  );
}
