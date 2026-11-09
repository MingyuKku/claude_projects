import { normalizeProduct } from "./normalize-product";

import type { CampaignDraft } from "@/entities/campaign";

type Product = CampaignDraft["product"];

/**
 * 2단계 입력을 고친 결과. 구매처 링크를 고치면 URL 확인 결과를 지우고(다시 확인해야 함),
 * 협찬제품 금액이 내려가면 대여 상품을 일반 상품으로 되돌림.
 * 링크와 확인 결과를 함께 넣는 경우(URL 확인 성공)는 그 결과를 따름.
 */
export function applyProductPatch(
  product: Product,
  patch: Partial<Product>,
): Product {
  const next = { ...product, ...patch };
  const hasUrlChanged =
    "purchaseUrl" in patch &&
    patch.purchaseUrl !== product.purchaseUrl &&
    !("purchaseUrlVerified" in patch);
  return normalizeProduct(
    hasUrlChanged ? { ...next, purchaseUrlVerified: null } : next,
  );
}
