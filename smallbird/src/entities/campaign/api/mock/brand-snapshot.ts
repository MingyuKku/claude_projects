import type { CampaignDetail } from "../../model/schema";

// 등록 내역(A-13)은 브랜드를 같이 줌. 엔티티끼리 가져올 수 없어서 `entities/brand`의 목 저장소가 `sessionStorage`에 남긴 값을 읽음
// (키와 항목 모양을 맞춰야 함). 다른 슬라이스의 메모리 캐시와 어긋나지 않도록 매번 저장소에서 읽음.
const BRAND_MOCK_KEY = "bigbird:mock:brands";

interface BrandMockDb {
  brands?: NonNullable<CampaignDetail["brand"]>[];
}

export function findMockBrand(brandIdx: number | null) {
  if (brandIdx === null) return null;
  try {
    const raw = window.sessionStorage.getItem(BRAND_MOCK_KEY);
    const db = raw ? (JSON.parse(raw) as BrandMockDb) : undefined;
    return db?.brands?.find((brand) => brand.brandIdx === brandIdx) ?? null;
  } catch {
    return null;
  }
}
