import { FormField } from "@/shared/components/form-field";
import { TextField } from "@/shared/components/text-field";
import { useTranslation } from "@/shared/i18n";
import { Input } from "@/shared/ui/input";

import { PRODUCT_TEXT_MAX_LENGTH } from "../../../model/constants";
import { useCampaignRegisterStore } from "../../../model/store-context";
import { AddressField } from "../../fields/AddressField";

// 매장방문형 2단계(Figma 7555:333927)의 입력 묶음. 칸 배치는 `ProductStep`이 className으로 정함.

interface FieldsProps {
  className?: string;
}

/** 방문 매장명. */
export function StoreNameField({ className }: FieldsProps) {
  const { t } = useTranslation("features/register-campaign");
  const storeName = useCampaignRegisterStore(
    (state) => state.draft.product.storeName,
  );
  const patchProduct = useCampaignRegisterStore((state) => state.patchProduct);

  return (
    <FormField
      className={className}
      label={t("product.storeVisit.name.label")}
      isRequired
    >
      {(control) => (
        <Input
          {...control}
          value={storeName ?? ""}
          placeholder={t("product.storeVisit.name.placeholder")}
          autoComplete="off"
          onChange={(event) => patchProduct({ storeName: event.target.value })}
        />
      )}
    </FormField>
  );
}

/** 매장 주소(상세 주소 칸 없음). */
export function StoreAddressField({ className }: FieldsProps) {
  const { t } = useTranslation("features/register-campaign");
  const storeAddress = useCampaignRegisterStore(
    (state) => state.draft.product.storeAddress,
  );
  const patchProduct = useCampaignRegisterStore((state) => state.patchProduct);

  return (
    <AddressField
      className={className}
      label={t("product.storeVisit.address.label")}
      isRequired
      hasDetail={false}
      placeholder={t("product.storeVisit.address.placeholder")}
      value={storeAddress}
      onChange={(next) => patchProduct({ storeAddress: next })}
    />
  );
}

/** 방문 쿠폰 인증번호. */
export function StoreCouponField({ className }: FieldsProps) {
  const { t } = useTranslation("features/register-campaign");
  const visitCouponCode = useCampaignRegisterStore(
    (state) => state.draft.product.visitCouponCode,
  );
  const patchProduct = useCampaignRegisterStore((state) => state.patchProduct);

  return (
    <FormField
      className={className}
      label={t("product.storeVisit.coupon.label")}
      isRequired
    >
      {(control) => (
        <Input
          {...control}
          value={visitCouponCode ?? ""}
          placeholder={t("product.storeVisit.coupon.placeholder")}
          autoComplete="off"
          onChange={(event) =>
            patchProduct({ visitCouponCode: event.target.value })
          }
        />
      )}
    </FormField>
  );
}

/** 방문 시 제공 혜택 및 수량(여러 줄, 최대 300자). */
export function StoreBenefitField({ className }: FieldsProps) {
  const { t } = useTranslation("features/register-campaign");
  const visitBenefit = useCampaignRegisterStore(
    (state) => state.draft.product.visitBenefit,
  );
  const patchProduct = useCampaignRegisterStore((state) => state.patchProduct);

  return (
    <FormField
      className={className}
      label={t("product.storeVisit.benefit.label")}
      isRequired
    >
      {(control) => (
        <TextField
          variant="count"
          isWide
          {...control}
          // 시안 높이 130px(입력 + 하단 글자 수). 기본 고정 높이(h-17)를 풀어 글자 수가 아래에 붙음.
          className="h-32.5"
          textareaClassName="h-auto min-h-0 flex-1"
          maxLength={PRODUCT_TEXT_MAX_LENGTH}
          value={visitBenefit ?? ""}
          placeholder={t("product.storeVisit.benefit.placeholder")}
          onChange={(event) =>
            patchProduct({ visitBenefit: event.target.value })
          }
        />
      )}
    </FormField>
  );
}
