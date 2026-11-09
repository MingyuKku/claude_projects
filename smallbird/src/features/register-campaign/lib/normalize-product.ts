import { RENTAL_MIN_PRODUCT_PRICE } from "../model/constants";

import type { CampaignDraft } from "@/entities/campaign";

type Product = CampaignDraft["product"];

/**
 * 2단계 입력을 고친 뒤 맞춰야 하는 규칙. "대여 상품"은 협찬제품 금액이 1,000,000원 이상일 때만 되므로,
 * 금액이 내려가면 "일반 상품"으로 되돌리고 대여 입력을 비움. "회수 없음"이면 회수 입력은 비우지 않고 둠(다시 켜면 이어 씀).
 */
export function normalizeProduct(product: Product): Product {
  const isRentalAllowed =
    (product.productPrice ?? 0) >= RENTAL_MIN_PRODUCT_PRICE;
  if (!product.rental || isRentalAllowed) return product;
  return {
    ...product,
    rental: false,
    rentalReturnAddress: null,
    rentalReturnShippingFee: null,
    rentalReturnContact: null,
  };
}
