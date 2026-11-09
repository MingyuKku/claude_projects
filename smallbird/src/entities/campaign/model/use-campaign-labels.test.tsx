import { renderHook } from "@testing-library/react";

import { useCampaignLabels } from "./use-campaign-labels";

describe("useCampaignLabels", () => {
  it("서버 코드를 한국어 문구로 바꾼다", () => {
    const { result } = renderHook(() => useCampaignLabels());

    expect(result.current.campaignType("PRODUCT_DELIVERY")).toBe("제품발송형");
    expect(result.current.platform("NAVER_BLOG")).toBe("블로그");
    expect(result.current.ageGroup("AGE_50S_PLUS")).toBe("50대 이상");
    expect(result.current.addOn("AI_MANUSCRIPT_CONFIRM")).toBe("AI 원고컨펌");
  });

  it("서비스 유형과 상품 유형을 합쳐 보여 준다", () => {
    const { result } = renderHook(() => useCampaignLabels());

    expect(result.current.serviceProduct("PICK", "BRAND")).toBe(
      "PICK형 브랜드형",
    );
    expect(result.current.serviceProduct("RECRUIT", "BRAND")).toBe(
      "모집형 브랜드형",
    );
  });

  it("목록에 없는 코드는 서버 값을 그대로 보여 준다", () => {
    const { result } = renderHook(() => useCampaignLabels());

    expect(result.current.platform("THREADS")).toBe("THREADS");
    expect(result.current.serviceProduct("LIVE", "BRAND")).toBe("LIVE BRAND");
  });
});
