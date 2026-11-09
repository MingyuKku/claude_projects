import { useId, useState } from "react";
import { toast } from "sonner";

import { FormField } from "@/shared/components/form-field";
import { PriceField, TextField } from "@/shared/components/text-field";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { checkPurchaseUrl } from "../../../api/register-api";
import { parseNumberInput } from "../../../lib/number-input";
import { PRODUCT_TEXT_MAX_LENGTH } from "../../../model/constants";
import {
  useCampaignRegisterStore,
  useCampaignRegisterStoreApi,
} from "../../../model/store-context";

// 구매리뷰형 2단계(Figma 7555:333980, URL 확인 오류·정상 7718:369367·7729:475034)의 입력 묶음. 칸 배치는 `ProductStep`이 className으로 정함.

interface FieldsProps {
  className?: string;
}

/** 구매제품명. */
export function PurchaseNameField({ className }: FieldsProps) {
  const { t } = useTranslation("features/register-campaign");
  const productName = useCampaignRegisterStore(
    (state) => state.draft.product.productName,
  );
  const patchProduct = useCampaignRegisterStore((state) => state.patchProduct);

  return (
    <FormField
      className={className}
      label={t("product.purchase.name.label")}
      isRequired
    >
      {(control) => (
        <Input
          {...control}
          value={productName ?? ""}
          placeholder={t("product.purchase.name.placeholder")}
          autoComplete="off"
          onChange={(event) =>
            patchProduct({ productName: event.target.value })
          }
        />
      )}
    </FormField>
  );
}

/** 구매제품 금액(모집형만, 6단계 리워드 상한). */
export function PurchasePriceField({ className }: FieldsProps) {
  const { t } = useTranslation("features/register-campaign");
  const purchasePrice = useCampaignRegisterStore(
    (state) => state.draft.product.purchasePrice,
  );
  const patchProduct = useCampaignRegisterStore((state) => state.patchProduct);

  return (
    <PriceField
      className={className}
      label={t("product.purchase.price.label")}
      isRequired
      unit={t("product.purchase.price.unit")}
      placeholder={t("product.purchase.price.placeholder")}
      autoComplete="off"
      value={purchasePrice === null ? "" : formatNumber(purchasePrice)}
      onChange={(event) =>
        patchProduct({ purchasePrice: parseNumberInput(event.target.value) })
      }
    />
  );
}

/**
 * 구매처 링크와 "URL 확인". 확인은 서버가 하고, 통과한 결과는 초안에 남아 "다음" 검사에 쓰임.
 * 링크를 고치면 스토어가 확인 결과를 지움. 유효하지 않다는 결과는 그 링크에서만 보임.
 */
export function PurchaseUrlField({ className }: FieldsProps) {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const store = useCampaignRegisterStoreApi();
  const inputId = useId();
  const messageId = `${inputId}-message`;
  const purchaseUrl = useCampaignRegisterStore(
    (state) => state.draft.product.purchaseUrl,
  );
  const isVerified = useCampaignRegisterStore(
    (state) => state.draft.product.purchaseUrlVerified === true,
  );
  const patchProduct = useCampaignRegisterStore((state) => state.patchProduct);
  const [invalidUrl, setInvalidUrl] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const url = purchaseUrl ?? "";
  const isInvalid = invalidUrl !== null && invalidUrl === url;
  const hasMessage = isVerified || isInvalid;

  async function handleClickCheck() {
    const target = url.trim();
    if (!target) return;
    setIsChecking(true);
    try {
      const result = await checkPurchaseUrl(target);
      // 확인하는 사이 링크를 고쳤으면 이 결과는 버림.
      if (store.getState().draft.product.purchaseUrl !== purchaseUrl) return;
      if (result.valid) {
        setInvalidUrl(null);
        patchProduct({
          purchaseUrl: result.normalizedUrl ?? target,
          purchaseUrlVerified: true,
        });
      } else {
        setInvalidUrl(url);
      }
    } catch (error) {
      console.error(error);
      toast.error(tCommon("error.unexpected"));
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-2">
        <Label htmlFor={inputId} className="gap-0.5">
          {t("product.purchase.url.label")}
          <span aria-hidden="true" className="font-semibold text-primary">
            *
          </span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id={inputId}
            value={url}
            placeholder={t("product.purchase.url.placeholder")}
            autoComplete="off"
            inputMode="url"
            aria-describedby={hasMessage ? messageId : undefined}
            aria-invalid={isInvalid || undefined}
            onChange={(event) =>
              patchProduct({ purchaseUrl: event.target.value })
            }
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            disabled={isChecking || url.trim() === ""}
            onClick={() => void handleClickCheck()}
          >
            {t("product.purchase.url.check")}
          </Button>
        </div>
        {hasMessage && (
          <p
            id={messageId}
            role={isInvalid ? "alert" : "status"}
            className={cn(
              "text-sm leading-5",
              isInvalid ? "font-medium text-destructive" : "text-primary",
            )}
          >
            {isInvalid
              ? t("product.purchase.url.invalid")
              : t("product.purchase.url.valid")}
          </p>
        )}
      </div>
    </div>
  );
}

/** 구매 관련 안내(여러 줄, 최대 300자). */
export function PurchaseGuideField({ className }: FieldsProps) {
  const { t } = useTranslation("features/register-campaign");
  const purchaseGuide = useCampaignRegisterStore(
    (state) => state.draft.product.purchaseGuide,
  );
  const patchProduct = useCampaignRegisterStore((state) => state.patchProduct);

  return (
    <FormField
      className={className}
      label={t("product.purchase.guide.label")}
      isRequired
    >
      {(control) => (
        <TextField
          variant="count"
          isWide
          {...control}
          className="h-32.5"
          textareaClassName="h-auto min-h-0 flex-1"
          maxLength={PRODUCT_TEXT_MAX_LENGTH}
          value={purchaseGuide ?? ""}
          placeholder={t("product.purchase.guide.placeholder")}
          onChange={(event) =>
            patchProduct({ purchaseGuide: event.target.value })
          }
        />
      )}
    </FormField>
  );
}
