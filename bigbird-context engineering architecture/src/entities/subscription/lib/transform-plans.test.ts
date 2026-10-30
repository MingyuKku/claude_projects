import { transformPlans } from "./transform-plans";

describe("transformPlans", () => {
  it("응답을 화면 모델로 바꾼다", () => {
    expect(
      transformPlans({
        yearlyDiscountRate: 20,
        plans: [
          {
            productType: "recruit",
            isAvailable: true,
            monthlyPrice: 99000,
            yearlyPrice: 950400,
          },
          {
            productType: "live",
            isAvailable: false,
            monthlyPrice: 199000,
            yearlyPrice: 1910400,
          },
        ],
      }),
    ).toEqual({
      yearlyDiscountRate: 20,
      plans: [
        {
          type: "recruit",
          isAvailable: true,
          monthlyPrice: 99000,
          yearlyPrice: 950400,
        },
        {
          type: "live",
          isAvailable: false,
          monthlyPrice: 199000,
          yearlyPrice: 1910400,
        },
      ],
    });
  });

  it("화면이 모르는 상품 유형은 건너뛴다", () => {
    const { plans } = transformPlans({
      yearlyDiscountRate: 0,
      plans: [
        {
          productType: "unknown",
          isAvailable: true,
          monthlyPrice: 1,
          yearlyPrice: 1,
        },
      ],
    });
    expect(plans).toEqual([]);
  });
});
