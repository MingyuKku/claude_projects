import { ChevronRight } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

import { PRODUCT_FEATURE_LINES } from "../model/services";
import { CardTitleBlock } from "./CardTitleBlock";
import { FeatureList } from "./FeatureList";

import type { ProductType } from "../model/services";
import type { ActiveProductType } from "@/entities/subscription";

interface ProductCardProps {
  service: ActiveProductType;
  product: ProductType;
  isSubscribed: boolean;
  onClickProduct: () => void;
}

// 구독 중인 서비스는 카드 전체가 버튼이고, 구독하지 않은 서비스는 "데모 캠페인 등록" 버튼만 있음.
export function ProductCard({
  service,
  product,
  isSubscribed,
  onClickProduct,
}: ProductCardProps) {
  const { t } = useTranslation("pages/campaign-create");
  const body = (
    <>
      <CardTitleBlock
        eyebrow={t(`service.${service}.name`)}
        title={t(`badge.${product}`)}
      />
      <FeatureList
        items={PRODUCT_FEATURE_LINES.map((line) => ({
          id: line,
          text: t(`product.${service}.${product}.${line}`),
        }))}
      />
    </>
  );

  if (isSubscribed) {
    return (
      <Card
        interactive
        className="min-h-67 focus-visible:ring-0 focus-visible:ring-offset-0 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-primary has-[button:focus-visible]:ring-offset-2 tablet:min-h-62.5"
      >
        <button
          type="button"
          className="flex flex-1 cursor-pointer flex-col items-stretch text-left outline-none"
          onClick={onClickProduct}
        >
          {body}
        </button>
      </Card>
    );
  }

  return (
    <Card className="tablet:min-h-87.5">
      <div className="flex flex-1 flex-col">{body}</div>
      <div className="flex flex-col ds-p-5">
        <Button variant="outline" className="w-full" onClick={onClickProduct}>
          {t("action.demoRegister")}
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </Card>
  );
}
