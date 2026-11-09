import { FormField } from "@/shared/components/form-field";
import { Inform } from "@/shared/components/inform";
import { PriceField } from "@/shared/components/text-field";
import { useTranslation, formatNumber } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";

import { parseNumberInput } from "../../../lib/number-input";
import { RENTAL_MIN_PRODUCT_PRICE } from "../../../model/constants";
import { useCampaignRegisterStore } from "../../../model/store-context";
import { ChoiceToggleGroup } from "../../fields/ChoiceToggleGroup";
import { PickupFields } from "./PickupFields";

// 제품발송형 2단계(Figma 7718:363095)의 입력 묶음 4개. PC는 왼쪽 칸(제품명·수량 → 반품 회수)과 오른쪽 칸(금액 → 대여 상품)으로 나누고,
// TAB·MO(1열)는 제품명·수량 → 금액 → 반품 회수 → 대여 상품 순서임. 칸 구성은 `ProductStep`이 `order`로 맞추고, 묶음은 `className`을 받음.
// 회수 있음·대여 상품을 고르면 회수 주소·비용·연락처 입력(`PickupFields`)이 이어서 나타남.

type YesNo = "yes" | "no";

interface FieldsProps {
  className?: string;
}

/** 협찬제품명과 1인당 제공 수량. */
export function ProductDeliveryNameFields({ className }: FieldsProps) {
  const { t } = useTranslation("features/register-campaign");
  const product = useCampaignRegisterStore((state) => state.draft.product);
  const patchProduct = useCampaignRegisterStore((state) => state.patchProduct);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <FormField label={t("product.delivery.name.label")} isRequired>
        {(control) => (
          <Input
            {...control}
            value={product.productName ?? ""}
            placeholder={t("product.delivery.name.placeholder")}
            autoComplete="off"
            onChange={(event) =>
              patchProduct({ productName: event.target.value })
            }
          />
        )}
      </FormField>
      <PriceField
        aria-label={t("product.delivery.quantity.label")}
        unit={t("product.delivery.quantity.unit")}
        placeholder={t("product.delivery.quantity.placeholder")}
        autoComplete="off"
        value={
          product.quantityPerInfluencer === null
            ? ""
            : formatNumber(product.quantityPerInfluencer)
        }
        onChange={(event) =>
          patchProduct({
            quantityPerInfluencer: parseNumberInput(event.target.value),
          })
        }
      />
    </div>
  );
}

/** 반품 회수 여부(선택)와 안내. */
export function ProductDeliveryReturnFields({ className }: FieldsProps) {
  const { t } = useTranslation("features/register-campaign");
  const product = useCampaignRegisterStore((state) => state.draft.product);
  const { returnRequired } = product;
  const patchProduct = useCampaignRegisterStore((state) => state.patchProduct);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <ChoiceToggleGroup<YesNo>
        label={t("product.delivery.return.label")}
        options={[
          { value: "no", label: t("product.delivery.return.no") },
          { value: "yes", label: t("product.delivery.return.yes") },
        ]}
        // 기본은 "회수 안함"이고 아직 고르지 않은 값(null)도 그렇게 봄.
        value={returnRequired ? "yes" : "no"}
        onChangeValue={(value) =>
          patchProduct({ returnRequired: value === "yes" })
        }
      />
      <Inform
        hasLineTop
        items={[{ id: "return", text: t("product.delivery.return.inform") }]}
      />
      {returnRequired && (
        <PickupFields
          labels={{
            address: t("product.delivery.return.address.label"),
            fee: t("product.delivery.return.fee.label"),
            contact: t("product.delivery.return.contact.label"),
          }}
          placeholders={{
            address: t("product.delivery.return.address.placeholder"),
            fee: t("product.delivery.return.fee.placeholder"),
            contact: t("product.delivery.return.contact.placeholder"),
          }}
          address={product.returnAddress}
          fee={product.returnShippingFee}
          contact={product.returnContact}
          onChangeAddress={(returnAddress) => patchProduct({ returnAddress })}
          onChangeFee={(returnShippingFee) =>
            patchProduct({ returnShippingFee })
          }
          onChangeContact={(returnContact) => patchProduct({ returnContact })}
        />
      )}
    </div>
  );
}

/** 협찬제품 금액(제품 1개당). */
export function ProductDeliveryPriceField({ className }: FieldsProps) {
  const { t } = useTranslation("features/register-campaign");
  const productPrice = useCampaignRegisterStore(
    (state) => state.draft.product.productPrice,
  );
  const patchProduct = useCampaignRegisterStore((state) => state.patchProduct);

  return (
    <PriceField
      className={className}
      label={t("product.delivery.price.label")}
      isRequired
      unit={t("product.delivery.price.unit")}
      placeholder={t("product.delivery.price.placeholder")}
      autoComplete="off"
      value={productPrice === null ? "" : formatNumber(productPrice)}
      onChange={(event) =>
        patchProduct({ productPrice: parseNumberInput(event.target.value) })
      }
    />
  );
}

/** 대여 상품 여부와 안내. */
export function ProductDeliveryRentalFields({ className }: FieldsProps) {
  const { t } = useTranslation("features/register-campaign");
  const product = useCampaignRegisterStore((state) => state.draft.product);
  const patchProduct = useCampaignRegisterStore((state) => state.patchProduct);
  // 대여 상품은 협찬제품 금액이 100만원 이상일 때만 고를 수 있음(디자이너 주석). 금액이 내려가면 스토어가 일반 상품으로 되돌림.
  const isRentalAllowed =
    (product.productPrice ?? 0) >= RENTAL_MIN_PRODUCT_PRICE;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <ChoiceToggleGroup<YesNo>
        label={t("product.delivery.rental.label")}
        isRequired
        options={[
          { value: "no", label: t("product.delivery.rental.no") },
          {
            value: "yes",
            label: t("product.delivery.rental.yes"),
            isDisabled: !isRentalAllowed,
          },
        ]}
        value={product.rental ? "yes" : "no"}
        onChangeValue={(value) => patchProduct({ rental: value === "yes" })}
      />
      <Inform
        hasLineTop
        items={[
          { id: "rental-price", text: t("product.delivery.rental.inform1") },
          { id: "rental-return", text: t("product.delivery.rental.inform2") },
        ]}
      />
      {product.rental && (
        <PickupFields
          labels={{
            address: t("product.delivery.rental.address.label"),
            fee: t("product.delivery.rental.fee.label"),
            contact: t("product.delivery.rental.contact.label"),
          }}
          placeholders={{
            address: t("product.delivery.rental.address.placeholder"),
            fee: t("product.delivery.rental.fee.placeholder"),
            contact: t("product.delivery.rental.contact.placeholder"),
          }}
          address={product.rentalReturnAddress}
          fee={product.rentalReturnShippingFee}
          contact={product.rentalReturnContact}
          onChangeAddress={(rentalReturnAddress) =>
            patchProduct({ rentalReturnAddress })
          }
          onChangeFee={(rentalReturnShippingFee) =>
            patchProduct({ rentalReturnShippingFee })
          }
          onChangeContact={(rentalReturnContact) =>
            patchProduct({ rentalReturnContact })
          }
        />
      )}
    </div>
  );
}
