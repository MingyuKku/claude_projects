import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { createCampaignDraft } from "@/entities/campaign";

import { useCampaignRegisterStore } from "../../model/store-context";
import { CampaignRegisterProvider } from "../CampaignRegisterProvider";
import { ConditionsStep } from "./ConditionsStep";

import type { CampaignServiceType, CampaignType } from "@/entities/campaign";

beforeEach(() => window.sessionStorage.clear());

// 1단계에서 유형을, 2단계에서 상품 금액을 입력했다고 보고 store에 넣고, 6단계 값을 화면 밖에서 읽는 도구.
function Probe({
  type,
  productPrice,
  purchasePrice,
}: {
  type: CampaignType;
  productPrice?: number;
  purchasePrice?: number;
}) {
  const change = useCampaignRegisterStore((state) => state.changeCampaignType);
  const patchProduct = useCampaignRegisterStore((state) => state.patchProduct);
  const conditions = useCampaignRegisterStore(
    (state) => state.draft.conditions,
  );
  return (
    <>
      <button
        onClick={() => {
          change(type);
          patchProduct({
            productPrice: productPrice ?? null,
            purchasePrice: purchasePrice ?? null,
          });
        }}
      >
        준비
      </button>
      <output data-testid="conditions">{JSON.stringify(conditions)}</output>
    </>
  );
}

const conditions = () =>
  JSON.parse(screen.getByTestId("conditions").textContent ?? "{}") as {
    postingPeriodMonths: number | null;
    secondaryCopyright: boolean | null;
    headcount: number | null;
    rewardPerInfluencer: number | null;
  };

async function renderStep(options: {
  serviceType: CampaignServiceType;
  type: CampaignType;
  productPrice?: number;
  purchasePrice?: number;
}) {
  const draft = await createCampaignDraft({
    serviceType: options.serviceType,
    productType: "BRAND",
  });
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <CampaignRegisterProvider campaignId={draft.campaignIdx}>
        <Probe
          type={options.type}
          productPrice={options.productPrice}
          purchasePrice={options.purchasePrice}
        />
        <ConditionsStep />
      </CampaignRegisterProvider>
    </SWRConfig>,
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "준비" }));
  return user;
}

describe("6단계 진행 조건", () => {
  it("PICK형은 유지기간·2차 저작권만 있고 인원·리워드는 없다", async () => {
    await renderStep({ serviceType: "PICK", type: "PRODUCT_DELIVERY" });

    expect(
      screen.getByRole("group", { name: /포스팅 유지기간/ }),
    ).toBeVisible();
    expect(
      screen.getByRole("group", { name: /2차 저작권 사용 여부/ }),
    ).toBeVisible();
    expect(screen.queryByText("진행 인원")).not.toBeInTheDocument();
    expect(screen.queryByText("리워드")).not.toBeInTheDocument();
  });

  it("유지기간 프리셋을 고르고, 직접 입력은 개월 칸이 나타나 정수로 저장한다", async () => {
    const user = await renderStep({
      serviceType: "PICK",
      type: "PRODUCT_DELIVERY",
    });

    await user.click(screen.getByRole("radio", { name: "6개월" }));
    expect(conditions().postingPeriodMonths).toBe(6);

    await user.click(screen.getByRole("radio", { name: "직접 입력" }));
    expect(conditions().postingPeriodMonths).toBeNull();
    await user.type(screen.getByPlaceholderText("기간을 입력하세요."), "18개");
    expect(conditions().postingPeriodMonths).toBe(18);

    await user.click(screen.getByRole("radio", { name: "3개월" }));
    expect(
      screen.queryByPlaceholderText("기간을 입력하세요."),
    ).not.toBeInTheDocument();
    expect(conditions().postingPeriodMonths).toBe(3);
  });

  it("2차 저작권은 사용·미사용을 boolean으로 저장한다", async () => {
    const user = await renderStep({
      serviceType: "PICK",
      type: "PRODUCT_DELIVERY",
    });

    await user.click(screen.getByRole("radio", { name: "사용" }));
    expect(conditions().secondaryCopyright).toBe(true);
    await user.click(screen.getByRole("radio", { name: "미사용" }));
    expect(conditions().secondaryCopyright).toBe(false);
  });

  it("PICK형 구매리뷰형은 입력 없이 안내만 보인다", async () => {
    await renderStep({ serviceType: "PICK", type: "PURCHASE_REVIEW" });

    expect(
      screen.getByText("진행 조건 설정이 필요하지 않습니다."),
    ).toBeVisible();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("모집형 제품발송형은 인원 스테퍼와 리워드가 있고 상한은 협찬제품 금액이다", async () => {
    const user = await renderStep({
      serviceType: "RECRUIT",
      type: "PRODUCT_DELIVERY",
      productPrice: 50_000,
    });

    await user.click(screen.getByRole("button", { name: "인원 늘리기" }));
    await user.click(screen.getByRole("button", { name: "인원 늘리기" }));
    expect(conditions().headcount).toBe(2);
    await user.click(screen.getByRole("button", { name: "인원 줄이기" }));
    await user.click(screen.getByRole("button", { name: "인원 줄이기" }));
    expect(conditions().headcount).toBeNull();
    expect(screen.getByRole("button", { name: "인원 줄이기" })).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText(/리워드 금액을 입력해주세요/),
      "30000",
    );
    expect(conditions().rewardPerInfluencer).toBe(30_000);
    expect(screen.getByText(/최대 50,000원까지 가능하며/)).toBeVisible();
  });

  it("모집형 구매리뷰형은 모집 인원과 리워드만 있고 상한은 구매제품 금액이다", async () => {
    await renderStep({
      serviceType: "RECRUIT",
      type: "PURCHASE_REVIEW",
      purchasePrice: 15_000,
    });

    expect(screen.getByRole("group", { name: /모집 인원/ })).toBeVisible();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByText(/최대 15,000원까지 가능하며/)).toBeVisible();
  });

  it("모집형 기자단형은 리워드 없이 인원·유지기간·2차 저작권만 있다", async () => {
    await renderStep({ serviceType: "RECRUIT", type: "PRESS" });

    expect(screen.getByRole("group", { name: /진행 인원/ })).toBeVisible();
    expect(screen.queryByText("리워드")).not.toBeInTheDocument();
  });
});
