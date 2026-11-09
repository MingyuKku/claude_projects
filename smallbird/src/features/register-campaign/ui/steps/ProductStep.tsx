import { cn } from "@/shared/lib/utils";

import { useCampaignRegisterStore } from "../../model/store-context";
import { ReadOnlyCampaignTypeGroup } from "../fields/ReadOnlyCampaignTypeGroup";
import {
  ProductDeliveryNameFields,
  ProductDeliveryPriceField,
  ProductDeliveryRentalFields,
  ProductDeliveryReturnFields,
} from "./product/ProductDeliveryFields";
import { ProductPressEmpty } from "./product/ProductPressFields";
import {
  PurchaseGuideField,
  PurchaseNameField,
  PurchasePriceField,
  PurchaseUrlField,
} from "./product/ProductPurchaseFields";
import {
  StoreAddressField,
  StoreBenefitField,
  StoreCouponField,
  StoreNameField,
} from "./product/ProductStoreVisitFields";

// 2단계 제품 정보 입력(Figma 7718:363095). 카드 위쪽에 1단계에서 고른 유형을 읽기 전용으로 보이고, 아래는 유형별 입력임.
// DOM 순서는 TAB·MO(1열) 시안 순서(유형 → 제품명·수량 → 금액 → 반품 회수 → 대여 상품)이고, 화면 순서와 키보드 이동 순서가 같음.
// 구매리뷰형은 유형 → 구매제품명 → (모집형만 구매제품 금액) → 구매처 링크 → 구매 관련 안내 순이고, PC는 링크가 오른쪽 열, 금액은 왼쪽 열 아래임.
// 매장방문형은 같은 순서(유형 → 매장명 → 주소 → 쿠폰 → 혜택)이고 PC는 주소·쿠폰이 오른쪽 열, 혜택이 두 열에 걸침. 기자단형은 빈 상태만 있음(안내 박스는 `STEP_NOTICES`).
// PC(≥1440)는 2열이라 칸을 grid 위치로 지정함: 왼쪽 열(유형·제품명·반품 회수), 오른쪽 열(금액, 대여 상품은 2~3행에 걸침).
// 행 높이는 왼쪽 열 항목이 정하고 대여 상품은 그 사이에 들어가 시안 PC 배치와 같아짐.
export function ProductStep() {
  const campaignType = useCampaignRegisterStore(
    (state) => state.draft.campaignInfo.campaignType,
  );
  const isDelivery = campaignType === "PRODUCT_DELIVERY";
  const isPress = campaignType === "PRESS";
  const isStoreVisit = campaignType === "STORE_VISIT";
  const isPurchaseReview = campaignType === "PURCHASE_REVIEW";
  // 구매제품 금액은 모집형만 있고, 있으면 PC에서 안내 칸이 한 행 아래로 내려감.
  const hasPurchasePrice = useCampaignRegisterStore(
    (state) => state.draft.serviceType === "RECRUIT",
  );

  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg border bg-card p-4 tablet:p-5 desktop:grid-cols-2 desktop:gap-x-6 desktop:p-6">
      <ReadOnlyCampaignTypeGroup className="min-w-0 desktop:col-start-1 desktop:row-start-1" />
      {isDelivery && (
        <>
          <ProductDeliveryNameFields className="min-w-0 desktop:col-start-1 desktop:row-start-2" />
          <ProductDeliveryPriceField className="min-w-0 desktop:col-start-2 desktop:row-start-1" />
          <ProductDeliveryReturnFields className="min-w-0 desktop:col-start-1 desktop:row-start-3" />
          <ProductDeliveryRentalFields className="min-w-0 desktop:col-start-2 desktop:row-span-2 desktop:row-start-2" />
        </>
      )}
      {isPress && <ProductPressEmpty className="col-span-full" />}
      {isStoreVisit && (
        <>
          <StoreNameField className="min-w-0 desktop:col-start-1 desktop:row-start-2" />
          <StoreAddressField className="min-w-0 desktop:col-start-2 desktop:row-start-1" />
          <StoreCouponField className="min-w-0 desktop:col-start-2 desktop:row-start-2" />
          <StoreBenefitField className="min-w-0 desktop:col-span-2 desktop:row-start-3" />
        </>
      )}
      {isPurchaseReview && (
        <>
          <PurchaseNameField className="min-w-0 desktop:col-start-1 desktop:row-start-2" />
          {hasPurchasePrice && (
            <PurchasePriceField className="min-w-0 desktop:col-start-1 desktop:row-start-3" />
          )}
          <PurchaseUrlField className="min-w-0 desktop:col-start-2 desktop:row-start-2" />
          <PurchaseGuideField
            className={cn(
              "min-w-0 desktop:col-span-2",
              hasPurchasePrice ? "desktop:row-start-4" : "desktop:row-start-3",
            )}
          />
        </>
      )}
    </div>
  );
}
